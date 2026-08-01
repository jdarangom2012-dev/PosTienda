# ============================================================
# ventas/views.py
# ============================================================
from rest_framework              import viewsets, status, filters
from rest_framework.decorators   import action
from rest_framework.response     import Response
from rest_framework.permissions  import IsAuthenticated
from rest_framework.pagination   import PageNumberPagination
from rest_framework.views        import APIView
from django.db                   import transaction
from django.db.models            import Sum, Count, Q
from django.utils                import timezone
from datetime                    import timedelta, datetime
from decimal                     import Decimal

from productos.models            import Producto
from inventario.models           import Inventario, MovimientoInventario
from .models                     import FormaPago, Venta, VentaDetalle, VentaPago, CierreCaja
from .serializers                import (
    FormaPagoSerializer,
    VentaReadSerializer,
    CrearVentaSerializer,
    CancelarVentaSerializer,
)
from usuarios.mixins import TiendaMixin
from usuarios.models import Usuario
from auditoria.models import registrar_auditoria
import pytz

bogota = pytz.timezone('America/Bogota')

class FormaPagoViewSet(TiendaMixin, viewsets.ModelViewSet):
    queryset           = FormaPago.objects.all().order_by('nombre')
    serializer_class   = FormaPagoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='activas')
    def activas(self, request):
        qs = self.get_queryset().filter(activa=True)
        return Response(FormaPagoSerializer(qs, many=True).data)

from rest_framework.pagination import PageNumberPagination

class VentaPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 2000
    
class VentaViewSet(TiendaMixin, viewsets.ReadOnlyModelViewSet):
    pagination_class   = VentaPagination   # ← agregar esta línea
    queryset = Venta.objects.select_related(
        'usuario'
    ).prefetch_related(
        'detalle__producto',
        'pagos__forma_pago'
    ).all().order_by('-fecha_hora')

    serializer_class   = VentaReadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # TiendaMixin filtra por tienda automáticamente
        qs        = super().get_queryset()
        fecha     = self.request.query_params.get('fecha')
        cajero_id = self.request.query_params.get('cajero_id')
        estado    = self.request.query_params.get('estado')

        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if fecha:
            qs = qs.filter(fecha_hora__date=fecha)
        if fecha_desde:
            qs = qs.filter(fecha_hora__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_hora__date__lte=fecha_hasta)
        if cajero_id:
            qs = qs.filter(usuario_id=cajero_id)
        if estado:
            qs = qs.filter(estado=estado)
        return qs

    @action(detail=False, methods=['get'], url_path='hoy')
    def hoy(self, request):
        hoy = timezone.now().astimezone(timezone.get_current_timezone()).date()  # ← CAMBIAR
        ventas = self.get_queryset().filter(
            fecha_hora__date=hoy,
            estado='COMPLETADA'
        )
        return Response(VentaReadSerializer(ventas, many=True).data)

    @action(detail=False, methods=['get'], url_path='resumen-hoy')
    def resumen_hoy(self, request):
        hoy    = timezone.now().astimezone(timezone.get_current_timezone()).date()
        tienda = self.get_tienda()

        qs_base    = self.get_queryset().filter(fecha_hora__date=hoy)
        ventas     = qs_base.filter(estado='COMPLETADA')
        canceladas = qs_base.filter(estado='CANCELADA').count()

        agg = ventas.aggregate(
            total_ingresos=Sum('total'),
            total_ventas=Count('id'),
        )
        total_ingresos = float(agg['total_ingresos'] or 0)
        total_ventas   = agg['total_ventas'] or 0

        # Filtros para VentaPago y VentaDetalle
        pagos_filter = {
            'venta__fecha_hora__date': hoy,
            'venta__estado': 'COMPLETADA',
        }
        if tienda:
            pagos_filter['venta__tienda'] = tienda

        # Separar contado vs crédito
        ingresos_credito = VentaPago.objects.filter(
            **pagos_filter,
            forma_pago__nombre__icontains='crédito'
        ).aggregate(t=Sum('monto'))['t'] or 0

        ventas_credito = VentaPago.objects.filter(
            **pagos_filter,
            forma_pago__nombre__icontains='crédito'
        ).values('venta').distinct().count()

        pagos_hoy = VentaPago.objects.filter(
            **pagos_filter
        ).values('forma_pago__nombre').annotate(
            total=Sum('monto'),
            cantidad=Count('id')
        ).order_by('-total')

        top_productos = VentaDetalle.objects.filter(
            **pagos_filter
        ).values('producto__nombre').annotate(
            total_vendido=Sum('cantidad')
        ).order_by('-total_vendido')[:5]

        return Response({
            'fecha':            str(hoy),
            'total_ventas':     total_ventas,
            'total_canceladas': canceladas,
            'total_ingresos':   total_ingresos,
            'ingresos_contado': float(total_ingresos - float(ingresos_credito)),
            'ingresos_credito': float(ingresos_credito),
            'ventas_credito':   ventas_credito,
            'ticket_promedio':  total_ingresos / max(total_ventas, 1),
            'pagos_por_forma':  list(pagos_hoy),
            'top_productos':    list(top_productos),
        })
    @action(detail=False, methods=['get'], url_path='resumen-semana')
    def resumen_semana(self, request):
        hoy    = timezone.now().astimezone(timezone.get_current_timezone()).date()
        hace_7 = hoy - timedelta(days=6)
        tienda = self.get_tienda()

        qs = self.get_queryset().filter(
            fecha_hora__date__gte=hace_7,
            estado='COMPLETADA',
        )

        agg = qs.aggregate(
            total_ingresos=Sum('total'),
            total_ventas=Count('id'),
        )
        total_ingresos = float(agg['total_ingresos'] or 0)
        total_ventas   = agg['total_ventas'] or 0

        # Ventas por día
        por_dia_fmt = [
            {
                'fecha':    str(d['fecha_hora__date']),
                'ingresos': float(d['ingresos'] or 0),
                'cantidad': d['cantidad'],
            }
            for d in qs.values('fecha_hora__date').annotate(
                ingresos=Sum('total'),
                cantidad=Count('id'),
            ).order_by('fecha_hora__date')
        ]

        # Filtros compartidos para VentaDetalle y VentaPago
        detalle_filter = {
            'venta__fecha_hora__date__gte': hace_7,
            'venta__estado': 'COMPLETADA',
        }
        if tienda:
            detalle_filter['venta__tienda'] = tienda

        top_productos = VentaDetalle.objects.filter(
            **detalle_filter
        ).values('producto__nombre').annotate(
            total_vendido=Sum('cantidad'),
            total_ingresos=Sum('subtotal'),
        ).order_by('-total_vendido')[:6]

        pagos_semana = VentaPago.objects.filter(
            **detalle_filter
        ).values('forma_pago__nombre').annotate(
            total=Sum('monto'),
        ).order_by('-total')

        canceladas = self.get_queryset().filter(
            fecha_hora__date__gte=hace_7,
            estado='CANCELADA',
        ).count()

        return Response({
            'desde':             str(hace_7),
            'hasta':             str(hoy),
            'total_ventas':      total_ventas,
            'total_ingresos':    total_ingresos,
            'ticket_promedio':   total_ingresos / max(total_ventas, 1),
            'ventas_canceladas': canceladas,
            'por_dia':           por_dia_fmt,
            'top_productos':     list(top_productos),
            'por_forma_pago': [
                {
                    'forma_pago_nombre': p['forma_pago__nombre'],
                    'total':             float(p['total'] or 0),
                }
                for p in pagos_semana
            ],
        })
    @action(detail=False, methods=['get'], url_path='resumen-periodo')
    def resumen_periodo(self, request):
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        tienda      = self.get_tienda()

        if not fecha_desde or not fecha_hasta:
            return Response({'error': 'Debes enviar fecha_desde y fecha_hasta.'}, status=400)

        qs = self.get_queryset().filter(
            fecha_hora__date__gte=fecha_desde,
            fecha_hora__date__lte=fecha_hasta,
            estado='COMPLETADA',
        )

        agg = qs.aggregate(
            total_ingresos=Sum('total'),
            total_ventas=Count('id'),
        )
        total_ingresos = float(agg['total_ingresos'] or 0)
        total_ventas   = agg['total_ventas'] or 0

        por_dia = [
            {
                'fecha':    str(d['fecha_hora__date']),
                'ingresos': float(d['ingresos'] or 0),
                'cantidad': d['cantidad'],
            }
            for d in qs.values('fecha_hora__date').annotate(
                ingresos=Sum('total'),
                cantidad=Count('id'),
            ).order_by('fecha_hora__date')
        ]

        detalle_filter = {
            'venta__fecha_hora__date__gte': fecha_desde,
            'venta__fecha_hora__date__lte': fecha_hasta,
            'venta__estado': 'COMPLETADA',
        }
        if tienda:
            detalle_filter['venta__tienda'] = tienda

        top_productos = VentaDetalle.objects.filter(
            **detalle_filter
        ).values('producto__nombre').annotate(
            total_vendido=Sum('cantidad'),
            total_ingresos=Sum('subtotal'),
        ).order_by('-total_vendido')[:10]

        por_forma_pago = VentaPago.objects.filter(
            **detalle_filter
        ).values('forma_pago__nombre').annotate(
            total=Sum('monto'),
        ).order_by('-total')

        canceladas = self.get_queryset().filter(
            fecha_hora__date__gte=fecha_desde,
            fecha_hora__date__lte=fecha_hasta,
            estado='CANCELADA',
        ).count()

        return Response({
            'desde':             fecha_desde,
            'hasta':             fecha_hasta,
            'total_ventas':      total_ventas,
            'total_ingresos':    total_ingresos,
            'ticket_promedio':   total_ingresos / max(total_ventas, 1),
            'ventas_canceladas': canceladas,
            'por_dia':           por_dia,
            'top_productos':     list(top_productos),
            'por_forma_pago': [
                {
                    'forma_pago_nombre': p['forma_pago__nombre'],
                    'total':             float(p['total'] or 0),
                }
                for p in por_forma_pago
            ],
        })

class ProcesarVentaView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CrearVentaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data        = serializer.validated_data
        detalle     = data['detalle']
        pagos       = data['pagos']
        tienda      = request.tienda
        usuario_obj = Usuario.objects.get(pk=request.user.pk)

        venta = Venta.objects.create(
            tienda    = tienda,
            usuario   = usuario_obj,
            subtotal  = Decimal('0.00'),
            descuento = Decimal('0.00'),
            total     = Decimal('0.00'),
            estado    = 'COMPLETADA',
        )

        subtotal_total  = Decimal('0.00')
        descuento_total = Decimal('0.00')

        for linea in detalle:
            producto    = Producto.objects.select_for_update().get(id=linea['producto_id'])
            precio_unit = producto.precio_venta
            descuento   = linea.get('descuento', Decimal('0.00'))
            cantidad    = linea['cantidad']
            subtotal    = (precio_unit * cantidad) - descuento

            VentaDetalle.objects.create(
                venta       = venta,
                producto    = producto,
                cantidad    = cantidad,
                precio_unit = precio_unit,
                descuento   = descuento,
                subtotal    = subtotal,
            )

            subtotal_total  += precio_unit * cantidad
            descuento_total += descuento

            inventario     = Inventario.objects.select_for_update().get(
                producto=producto, tienda=tienda
            )
            stock_anterior = inventario.cantidad_actual
            stock_nuevo    = stock_anterior - cantidad
            inventario.cantidad_actual = stock_nuevo
            inventario.save()

            MovimientoInventario.objects.create(
                tienda          = tienda,
                producto        = producto,
                tipo_movimiento = 'SALIDA',
                cantidad        = cantidad,
                stock_anterior  = stock_anterior,
                stock_nuevo     = stock_nuevo,
                referencia_id   = venta.id,
                referencia_tipo = 'VENTA',
                motivo          = f'Venta #{venta.id}',
                usuario         = usuario_obj,
            )

        venta.subtotal  = subtotal_total
        venta.descuento = descuento_total
        venta.total     = subtotal_total - descuento_total
        venta.save()
        
        registrar_auditoria(
            request, 'INSERT', tabla='ventas',
            registro_id=venta.id,
            valor_nuevo={'total': str(venta.total), 'items': len(detalle)},
            detalle=f'Venta #{venta.id} — Total: ${venta.total} — {len(detalle)} productos',
        )

        for pago in pagos:
            forma_pago = FormaPago.objects.get(id=pago['forma_pago_id'])
            VentaPago.objects.create(
                venta      = venta,
                forma_pago = forma_pago,
                monto      = pago['monto'],
                referencia = pago.get('referencia', ''),
            )

        total_pagado = sum(p['monto'] for p in pagos)
        cambio       = total_pagado - venta.total

        detalle_data = []
        for d in VentaDetalle.objects.filter(venta=venta).select_related('producto'):
            detalle_data.append({
                'id':              d.id,
                'producto':        d.producto.id,
                'producto_nombre': d.producto.nombre,
                'cantidad':        str(d.cantidad),
                'precio_unit':     str(d.precio_unit),
                'descuento':       str(d.descuento),
                'subtotal':        str(d.subtotal),
            })

        pagos_data = []
        for p in VentaPago.objects.filter(venta=venta).select_related('forma_pago'):
            pagos_data.append({
                'id':                p.id,
                'forma_pago':        p.forma_pago.id,
                'forma_pago_nombre': p.forma_pago.nombre,
                'monto':             str(p.monto),
            })

        return Response({
            'mensaje': 'Venta procesada correctamente.',
            'cambio':  float(cambio) if cambio > 0 else 0,
            'venta': {
                'id':         venta.id,
                'fecha_hora': str(venta.fecha_hora),
                'total':      str(venta.total),
                'subtotal':   str(venta.subtotal),
                'descuento':  str(venta.descuento),
                'estado':     venta.estado,
                'cajero':     request.user.username,
                'detalle':    detalle_data,
                'pagos':      pagos_data,
            },
        }, status=status.HTTP_201_CREATED)


class CancelarVentaView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, venta_id):
        tienda = request.tienda
        try:
            qs = Venta.objects.prefetch_related('detalle__producto')
            if tienda:
                qs = qs.filter(tienda=tienda)
            venta = qs.get(id=venta_id)
        except Venta.DoesNotExist:
            return Response(
                {'error': 'Venta no encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if venta.estado != 'COMPLETADA':
            return Response(
                {'error': f'No se puede cancelar una venta con estado "{venta.estado}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CancelarVentaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        venta.estado             = 'CANCELADA'
        venta.motivo_cancelacion = serializer.validated_data['motivo']
        venta.save()
        
        registrar_auditoria(
            request, 'CANCEL', tabla='ventas',
            registro_id=venta.id,
            valor_anterior={'estado': 'COMPLETADA'},
            valor_nuevo={'estado': 'CANCELADA', 'motivo': serializer.validated_data['motivo']},
            detalle=f'Cancelación venta #{venta.id}: {serializer.validated_data["motivo"]}',
        )

        usuario_obj = Usuario.objects.get(pk=request.user.pk)

        for linea in venta.detalle.all():
            inventario     = Inventario.objects.select_for_update().get(
                producto=linea.producto, tienda=tienda
            )
            stock_anterior = inventario.cantidad_actual
            stock_nuevo    = stock_anterior + linea.cantidad
            inventario.cantidad_actual = stock_nuevo
            inventario.save()

            MovimientoInventario.objects.create(
                tienda          = tienda,
                producto        = linea.producto,
                tipo_movimiento = 'DEVOLUCION',
                cantidad        = linea.cantidad,
                stock_anterior  = stock_anterior,
                stock_nuevo     = stock_nuevo,
                referencia_id   = venta.id,
                referencia_tipo = 'VENTA',
                motivo          = f'Cancelación venta #{venta.id}: {serializer.validated_data["motivo"]}',
                usuario         = usuario_obj,
            )

        return Response({
            'mensaje': f'Venta #{venta.id} cancelada correctamente.',
            'motivo':  serializer.validated_data['motivo'],
        }, status=status.HTTP_200_OK)

class CierreCajaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtiene el cierre activo de hoy o el historial"""
        tienda = request.tienda
        hoy    = timezone.now().astimezone(timezone.get_current_timezone()).date()

        # Verificar si hay caja abierta hoy
        caja_activa = CierreCaja.objects.filter(
            tienda=tienda, fecha=hoy, estado='ABIERTA'
        ).first()

        if caja_activa:
            # Calcular totales en tiempo real
            pagos_filter = {
                'venta__fecha_hora__date': hoy,
                'venta__estado': 'COMPLETADA',
                'venta__tienda': tienda,
            }
            from creditos.models import AbonoCredito
            ventas_efectivo = VentaPago.objects.filter(
                **pagos_filter, forma_pago__nombre__icontains='efectivo'
            ).aggregate(t=Sum('monto'))['t'] or 0

            ventas_nequi = VentaPago.objects.filter(
                **pagos_filter, forma_pago__nombre__icontains='nequi'
            ).aggregate(t=Sum('monto'))['t'] or 0
            
            desde  = bogota.localize(datetime.strptime(str(hoy), '%Y-%m-%d'))
            hasta  = bogota.localize(datetime.strptime(str(hoy), '%Y-%m-%d') + timedelta(days=1))

            abonos_efectivo = AbonoCredito.objects.filter(
                credito__tienda=tienda,
                created_at__gte=desde,
                created_at__lt=hasta,
                forma_pago='EFECTIVO',
            ).aggregate(t=Sum('monto'))['t'] or 0

            abonos_nequi = AbonoCredito.objects.filter(
                credito__tienda=tienda,
                created_at__gte=desde,
                created_at__lt=hasta,
                forma_pago='NEQUI',
            ).aggregate(t=Sum('monto'))['t'] or 0

            caja_activa.total_ventas_efectivo = ventas_efectivo
            caja_activa.total_ventas_nequi    = ventas_nequi
            caja_activa.total_abonos_efectivo = abonos_efectivo
            caja_activa.total_abonos_nequi    = abonos_nequi

            return Response(self._serializar(caja_activa))

    def post(self, request):
        """Abrir caja"""
        tienda  = request.tienda
        hoy     = timezone.now().astimezone(timezone.get_current_timezone()).date()
        usuario = Usuario.objects.get(pk=request.user.pk)

        # Verificar si ya hay caja abierta
        if CierreCaja.objects.filter(tienda=tienda, fecha=hoy, estado='ABIERTA').exists():
            return Response({'error': 'Ya hay una caja abierta hoy.'}, status=400)

        monto_apertura = request.data.get('monto_apertura', 0)

        caja = CierreCaja.objects.create(
            tienda         = tienda,
            usuario        = usuario,
            fecha          = hoy,
            monto_apertura = monto_apertura,
        )
        return Response(self._serializar(caja), status=201)

    def put(self, request):
        """Cerrar caja"""
        tienda = request.tienda
        hoy    = timezone.now().astimezone(timezone.get_current_timezone()).date()

        caja = CierreCaja.objects.filter(
            tienda=tienda, fecha=hoy, estado='ABIERTA'
        ).first()

        if not caja:
            return Response({'error': 'No hay caja abierta.'}, status=400)

        # Calcular totales del día
        pagos_filter = {
            'venta__fecha_hora__date': hoy,
            'venta__estado': 'COMPLETADA',
            'venta__tienda': tienda,
        }

        ventas_efectivo = VentaPago.objects.filter(
            **pagos_filter, forma_pago__nombre__icontains='efectivo'
        ).aggregate(t=Sum('monto'))['t'] or 0

        ventas_nequi = VentaPago.objects.filter(
            **pagos_filter, forma_pago__nombre__icontains='nequi'
        ).aggregate(t=Sum('monto'))['t'] or 0

        from creditos.models import AbonoCredito
        abonos_efectivo = AbonoCredito.objects.filter(
            credito__tienda=tienda,
            created_at__date=hoy,
            forma_pago='EFECTIVO',
        ).aggregate(t=Sum('monto'))['t'] or 0

        abonos_nequi = AbonoCredito.objects.filter(
            credito__tienda=tienda,
            created_at__date=hoy,
            forma_pago='NEQUI',
        ).aggregate(t=Sum('monto'))['t'] or 0

        monto_real = Decimal(str(request.data.get('monto_real', 0)))
        monto_esperado = caja.monto_apertura + Decimal(str(ventas_efectivo)) + Decimal(str(abonos_efectivo))

        caja.total_ventas_efectivo = ventas_efectivo
        caja.total_ventas_nequi    = ventas_nequi
        caja.total_abonos_efectivo = abonos_efectivo
        caja.total_abonos_nequi    = abonos_nequi
        caja.monto_esperado        = monto_esperado
        caja.monto_real            = monto_real
        caja.diferencia            = monto_real - monto_esperado
        caja.hora_cierre           = timezone.now()
        caja.notas                 = request.data.get('notas', '')
        caja.estado                = 'CERRADA'
        caja.save()

        return Response(self._serializar(caja))

    def _serializar(self, caja):
        return {
            'id':                    caja.id,
            'fecha':                 str(caja.fecha),
            'estado':                caja.estado,
            'hora_apertura':         str(caja.hora_apertura),
            'hora_cierre':           str(caja.hora_cierre) if caja.hora_cierre else None,
            'usuario':               caja.usuario.username,
            'monto_apertura':        float(caja.monto_apertura),
            'total_ventas_efectivo': float(caja.total_ventas_efectivo),
            'total_ventas_nequi':    float(caja.total_ventas_nequi),
            'total_abonos_efectivo': float(caja.total_abonos_efectivo),
            'total_abonos_nequi':    float(caja.total_abonos_nequi),
            'monto_esperado':        float(caja.monto_apertura + caja.total_ventas_efectivo + caja.total_abonos_efectivo),
            'monto_real':            float(caja.monto_real) if caja.monto_real is not None else None,
            'diferencia':            float(caja.diferencia) if caja.diferencia is not None else None,
            'notas':                 caja.notas or '',
        }


class HistorialCajaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tienda      = request.tienda
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')

        qs = CierreCaja.objects.filter(tienda=tienda, estado='CERRADA')
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)

        data = []
        for caja in qs:
            data.append({
                'id':                    caja.id,
                'fecha':                 str(caja.fecha),
                'usuario':               caja.usuario.username,
                'monto_apertura':        float(caja.monto_apertura),
                'total_ventas_efectivo': float(caja.total_ventas_efectivo),
                'total_ventas_nequi':    float(caja.total_ventas_nequi),
                'total_abonos_efectivo': float(caja.total_abonos_efectivo),
                'total_abonos_nequi':    float(caja.total_abonos_nequi),
                'monto_esperado':        float(caja.monto_esperado),
                'monto_real':            float(caja.monto_real) if caja.monto_real else 0,
                'diferencia':            float(caja.diferencia) if caja.diferencia else 0,
                'notas':                 caja.notas or '',
                'hora_apertura':         str(caja.hora_apertura),
                'hora_cierre':           str(caja.hora_cierre) if caja.hora_cierre else None,
            })

        return Response(data)