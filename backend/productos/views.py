# ============================================================
# productos/views.py
# ============================================================
from rest_framework              import viewsets, status, filters
from rest_framework.decorators   import action
from rest_framework.response     import Response
from rest_framework.permissions  import IsAuthenticated
from django.db.models            import Q, F
from decimal                     import Decimal, InvalidOperation
from .models      import Categoria, Producto
from .serializers import (
    CategoriaSerializer, ProductoSerializer,
    ProductoListSerializer, ProductoBusquedaSerializer
)
from inventario.models import Inventario
from usuarios.mixins   import TiendaMixin
from rest_framework.filters import SearchFilter, OrderingFilter
from auditoria.models import registrar_auditoria

class CategoriaViewSet(TiendaMixin, viewsets.ModelViewSet):
    queryset           = Categoria.objects.all().order_by('nombre')
    serializer_class   = CategoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['nombre']

    def get_queryset(self):
        # TiendaMixin filtra por tienda automáticamente
        qs = super().get_queryset()
        return qs

    @action(detail=False, methods=['get'], url_path='activas')
    def activas(self, request):
        qs = self.get_queryset().filter(activa=True)
        return Response(CategoriaSerializer(qs, many=True).data)


class ProductoViewSet(TiendaMixin, viewsets.ModelViewSet):
    queryset = Producto.objects.select_related(
                   'categoria', 'inventario'
               ).order_by('nombre')
    permission_classes = [IsAuthenticated]
    filter_backends    = [SearchFilter, OrderingFilter]  # ← AGREGAR
    search_fields      = ['nombre', 'codigo_barras']     # ← AGREGAR
    ordering_fields    = ['nombre', 'precio_venta']
    ordering    = ['nombre']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductoListSerializer
        if self.action == 'buscar':
            return ProductoBusquedaSerializer
        return ProductoSerializer

    def get_queryset(self):
        # Primero filtra por tienda via TiendaMixin
        qs = super().get_queryset().filter(activo=True).order_by('nombre') 
        # Filtro adicional por categoría
        categoria_id = self.request.query_params.get('categoria')
        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)
        return qs

    def perform_create(self, serializer):
        tienda = self.get_tienda()
        
        # ── Generar código interno si no tiene código de barras ──
        codigo = self.request.data.get('codigo_barras', '').strip()
        if not codigo:
            # Buscar el número máximo correctamente
            codigos_int = Producto.objects.filter(
                tienda=tienda,
                codigo_barras__startswith='INT-'
            ).values_list('codigo_barras', flat=True)

            max_num = 0
            for cod in codigos_int:
                try:
                    num = int(cod.replace('INT-', ''))
                    if num > max_num:
                        max_num = num
                except:
                    pass

            codigo_interno = f'INT-{max_num + 1:04d}'
            serializer.validated_data['codigo_barras'] = codigo_interno
        # ─────────────────────────────────────────────────────────

        producto = serializer.save(tienda=tienda)
        
        registrar_auditoria(
            self.request, 'INSERT', tabla='productos',
            registro_id=producto.id,
            valor_nuevo={'nombre': producto.nombre, 'precio_venta': str(producto.precio_venta)},
            detalle=f'Producto creado: {producto.nombre}',
        )
         
        Inventario.objects.get_or_create(
            producto=producto,
            defaults={'cantidad_actual': 0, 'tienda': tienda}
        )

    def destroy(self, request, *args, **kwargs):
        producto        = self.get_object()
        producto.activo = False
        producto.save()
        return Response(
            {'mensaje': f'Producto "{producto.nombre}" desactivado correctamente.'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='buscar')
    def buscar(self, request):
        q      = request.query_params.get('q', '').strip()
        codigo = request.query_params.get('codigo', '').strip()

        if not q and not codigo:
            return Response(
                {'error': 'Se requiere el parámetro q o codigo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filtra por tienda
        qs = self.get_queryset()

        if codigo:
            qs = qs.filter(codigo_barras=codigo)
        elif q:
            qs = qs.filter(
                Q(nombre__icontains=q) |
                Q(codigo_barras__icontains=q)
            )[:20]

        return Response(ProductoBusquedaSerializer(qs, many=True).data)

    @action(detail=False, methods=['post'], url_path='crear-fruver')
    def crear_fruver(self, request):
        """Crea (o reutiliza) un producto en la categoría Fruver desde el POS."""
        tienda = self.get_tienda()
        nombre = (request.data.get('nombre') or '').strip()
        try:
            precio = Decimal(str(request.data.get('precio')))
        except (InvalidOperation, TypeError):
            precio = Decimal('0')
        if len(nombre) < 2:
            return Response({'error': 'Nombre inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        if precio <= 0:
            return Response({'error': 'El precio debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        categoria = Categoria.objects.filter(tienda=tienda, nombre__iexact='fruver').first()
        if not categoria:
            return Response({'error': 'No existe la categoría "Fruver".'},
                            status=status.HTTP_400_BAD_REQUEST)

        producto = Producto.objects.filter(
            tienda=tienda, categoria=categoria, nombre__iexact=nombre).first()
        if producto:
            if not producto.activo:
                producto.activo = True
            producto.precio_venta = precio
            producto.save()
        else:
            codigos = Producto.objects.filter(
                tienda=tienda, codigo_barras__startswith='INT-'
            ).values_list('codigo_barras', flat=True)
            max_num = 0
            for cod in codigos:
                try:
                    max_num = max(max_num, int(cod.replace('INT-', '')))
                except ValueError:
                    pass
            producto = Producto.objects.create(
                tienda=tienda, categoria=categoria, nombre=nombre,
                codigo_barras=f'INT-{max_num + 1:04d}',
                precio_costo=Decimal('0'), precio_venta=precio,
                unidad_medida='UNIDAD',
            )
            Inventario.objects.get_or_create(
                producto=producto, defaults={'cantidad_actual': 0, 'tienda': tienda})
            registrar_auditoria(
                request, 'INSERT', tabla='productos', registro_id=producto.id,
                valor_nuevo={'nombre': producto.nombre, 'precio_venta': str(precio)},
                detalle=f'Producto Fruver creado desde POS: {producto.nombre}',
            )
        return Response(ProductoBusquedaSerializer(producto).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='bajo-minimo')
    def bajo_minimo(self, request):
        qs = self.get_queryset().filter(
            inventario__cantidad_actual__lte=F('stock_minimo')
        )
        return Response({
            'total':     qs.count(),
            'productos': ProductoListSerializer(qs, many=True).data,
        })

    @action(detail=False, methods=['get'], url_path='por-categoria/(?P<categoria_id>[^/.]+)')
    def por_categoria(self, request, categoria_id=None):
        qs = self.get_queryset().filter(categoria_id=categoria_id)
        return Response(ProductoListSerializer(qs, many=True).data)

    @action(detail=True, methods=['patch'], url_path='cambiar-precio')
    def cambiar_precio(self, request, pk=None):
        producto     = self.get_object()
        precio_venta = request.data.get('precio_venta')
        precio_costo = request.data.get('precio_costo')
        if precio_venta:
            producto.precio_venta = precio_venta
        if precio_costo:
            producto.precio_costo = precio_costo
        producto.save()
        
        registrar_auditoria(
            request, 'PRECIO', tabla='productos',
            registro_id=producto.id,
            valor_nuevo={'precio_venta': precio_venta, 'precio_costo': precio_costo},
            detalle=f'Cambio de precio: {producto.nombre}',
        )
         
        return Response(ProductoSerializer(producto).data)

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        producto        = self.get_object()
        producto.activo = True
        producto.save()
        return Response({'mensaje': f'Producto "{producto.nombre}" activado.'})