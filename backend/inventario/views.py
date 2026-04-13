# ============================================================
# inventario/views.py
# ============================================================
from rest_framework              import viewsets, status, filters
from rest_framework.decorators   import action
from rest_framework.response     import Response
from rest_framework.permissions  import IsAuthenticated
from rest_framework.views        import APIView
from django.db                   import transaction
from django.db.models            import F
from productos.models            import Producto
from .models                     import Inventario, MovimientoInventario
from .serializers                import (
    InventarioSerializer, MovimientoInventarioSerializer,
    EntradaMercanciaSerializer, AjusteInventarioSerializer, CrearMovimientoSerializer   
)
from usuarios.mixins import TiendaMixin
from usuarios.models import Usuario
from rest_framework.pagination import PageNumberPagination

class InventarioPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 2000          # ← permite hasta 2000


class InventarioViewSet(TiendaMixin, viewsets.ReadOnlyModelViewSet):
    pagination_class = InventarioPagination
    queryset = Inventario.objects.select_related(
        'producto', 'producto__categoria'
    ).all()
    serializer_class   = InventarioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['producto__nombre', 'producto__codigo_barras']

    def get_queryset(self):
        # TiendaMixin filtra por tienda automáticamente
        return super().get_queryset()

    @action(detail=False, methods=['get'], url_path='alertas')
    def alertas(self, request):
        alertas = self.get_queryset().filter(
            cantidad_actual__lte=F('producto__stock_minimo')
        ).order_by('cantidad_actual')
        return Response({
            'total_alertas': alertas.count(),
            'productos':     InventarioSerializer(alertas, many=True).data,
        })

    @action(detail=False, methods=['get'], url_path='por-producto/(?P<producto_id>[^/.]+)')
    def por_producto(self, request, producto_id=None):
        try:
            inv = self.get_queryset().get(producto_id=producto_id)
            return Response(InventarioSerializer(inv).data)
        except Inventario.DoesNotExist:
            return Response(
                {'error': 'No se encontró registro de inventario para este producto.'},
                status=status.HTTP_404_NOT_FOUND
            )


class MovimientoViewSet(TiendaMixin, viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.select_related(
        'producto', 'usuario'
    ).all().order_by('-created_at')
    serializer_class   = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated]
    http_method_names  = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs          = super().get_queryset()
        producto_id = self.request.query_params.get('producto_id')
        tipo        = self.request.query_params.get('tipo')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if producto_id:
            qs = qs.filter(producto_id=producto_id)
        if tipo:
            qs = qs.filter(tipo_movimiento=tipo)
        if fecha_desde:
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        tienda      = self.get_tienda()
        producto_id = serializer.validated_data['producto_id']
        producto    = Producto.objects.get(id=producto_id)
        tipo        = serializer.validated_data['tipo_movimiento']
        cantidad    = serializer.validated_data['cantidad']

        inventario     = Inventario.objects.select_for_update().get(
            producto=producto, tienda=tienda
        )
        stock_anterior = inventario.cantidad_actual

        if tipo == 'AJUSTE_POS':
            stock_nuevo = cantidad
        elif tipo == 'AJUSTE_NEG':
            stock_nuevo = stock_anterior - cantidad
        elif tipo == 'SALIDA':
            if cantidad > stock_anterior:
                from rest_framework.exceptions import ValidationError
                raise ValidationError(
                    f'Stock insuficiente. Disponible: {stock_anterior}'
                )
            stock_nuevo = stock_anterior - cantidad
        else:
            stock_nuevo = stock_anterior + cantidad

        inventario.cantidad_actual = stock_nuevo
        inventario.save()

        usuario_obj = Usuario.objects.get(pk=self.request.user.pk)
        MovimientoInventario.objects.create(
            tienda          = tienda,
            producto        = producto,
            tipo_movimiento = tipo,
            cantidad        = cantidad,
            stock_anterior  = stock_anterior,
            stock_nuevo     = stock_nuevo,
            motivo          = serializer.validated_data.get('motivo', ''),
            usuario         = usuario_obj,
        )

    @action(detail=False, methods=['get'], url_path='por-producto/(?P<producto_id>[^/.]+)')
    def por_producto(self, request, producto_id=None):
        qs = self.get_queryset().filter(producto_id=producto_id)
        return Response(MovimientoInventarioSerializer(qs, many=True).data)

    def get_serializer_class(self):
        if self.action == 'create':
            return CrearMovimientoSerializer
        return MovimientoInventarioSerializer

class EntradaMercanciaView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = EntradaMercanciaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data       = serializer.validated_data
        tienda     = request.tienda
        producto   = Producto.objects.get(id=data['producto_id'])
        inventario = Inventario.objects.select_for_update().get(
            producto=producto, tienda=tienda
        )

        stock_anterior = inventario.cantidad_actual
        stock_nuevo    = stock_anterior + data['cantidad']

        inventario.cantidad_actual = stock_nuevo
        inventario.save()

        usuario_obj = Usuario.objects.get(pk=request.user.pk)
        movimiento  = MovimientoInventario.objects.create(
            tienda          = tienda,
            producto        = producto,
            tipo_movimiento = 'ENTRADA',
            cantidad        = data['cantidad'],
            stock_anterior  = stock_anterior,
            stock_nuevo     = stock_nuevo,
            referencia_tipo = 'COMPRA',
            motivo          = data.get('motivo', 'Entrada de mercancía'),
            usuario         = usuario_obj,
        )

        return Response({
            'mensaje':        f'Entrada registrada para {producto.nombre}.',
            'stock_anterior': float(stock_anterior),
            'cantidad':       float(data['cantidad']),
            'stock_nuevo':    float(stock_nuevo),
            'movimiento_id':  movimiento.id,
        }, status=status.HTTP_201_CREATED)


class AjusteInventarioView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def perform_create(self, serializer):
        print("=== MOVIMIENTOVIEWSET PERFORM_CREATE ===")
        print("tipo:", serializer.validated_data.get('tipo_movimiento'))
        print("cantidad:", serializer.validated_data.get('cantidad'))
        tienda      = self.get_tienda()
        producto_id = serializer.validated_data['producto_id']
        producto    = Producto.objects.get(id=producto_id)
        tipo        = serializer.validated_data['tipo_movimiento']
        cantidad    = serializer.validated_data['cantidad']

        inventario     = Inventario.objects.select_for_update().get(
            producto=producto, tienda=tienda
        )
        stock_anterior = inventario.cantidad_actual

        if tipo == 'AJUSTE_POS':          # ← CORREGIDO
            stock_nuevo = cantidad
        elif tipo == 'AJUSTE_NEG':        # ← AGREGADO
            stock_nuevo = stock_anterior - cantidad
        elif tipo == 'SALIDA':
            if cantidad > stock_anterior:
                from rest_framework.exceptions import ValidationError
                raise ValidationError(
                    f'Stock insuficiente. Disponible: {stock_anterior}'
                )
            stock_nuevo = stock_anterior - cantidad
        else:
            stock_nuevo = stock_anterior + cantidad

        inventario.cantidad_actual = stock_nuevo
        inventario.save()

        usuario_obj = Usuario.objects.get(pk=self.request.user.pk)
        MovimientoInventario.objects.create(
            tienda          = tienda,
            producto        = producto,
            tipo_movimiento = tipo,
            cantidad        = cantidad,
            stock_anterior  = stock_anterior,
            stock_nuevo     = stock_nuevo,
            motivo          = serializer.validated_data.get('motivo', ''),
            usuario         = usuario_obj,
        )

