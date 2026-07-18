# ============================================================
# APP: creditos → creditos/views.py
# ============================================================
from rest_framework          import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models        import Sum, Q, Count
from django.conf             import settings
from django.utils            import timezone as tz
from decimal                 import Decimal
from usuarios.mixins         import TiendaMixin
from usuarios.models         import Usuario
from .models                 import Credito, AbonoCredito
from .serializers            import (
    CreditoSerializer, CrearCreditoSerializer, AbonarCreditoSerializer
)
from django.db.models.functions import TruncDate
import pytz
bogota = pytz.timezone('America/Bogota')
        
class CreditoViewSet(TiendaMixin, viewsets.ModelViewSet):
    queryset           = Credito.objects.prefetch_related('abonos').all()
    serializer_class   = CreditoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['cliente_nombre', 'cliente_telefono']
    pagination_class   = None  # ← agregar esta línea

    def get_queryset(self):
        qs          = super().get_queryset()
        estado      = self.request.query_params.get('estado')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        cliente     = self.request.query_params.get('cliente')

        if estado:
            qs = qs.filter(estado=estado)
        if fecha_desde:
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        if cliente:
            qs = qs.filter(cliente_nombre__icontains=cliente)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CrearCreditoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data   = serializer.validated_data
        tienda = self.get_tienda()

        # ── Validar tope por cliente ──────────────────────
        tope        = Decimal(str(getattr(settings, 'CREDITO_TOPE_MAXIMO', 50000)))
        nueva_deuda = Decimal(str(data['total_deuda']))

        creditos_cliente = Credito.objects.filter(
            tienda                 = tienda,
            cliente_nombre__iexact = data['cliente_nombre'],
            estado                 = 'PENDIENTE',
        )
        saldo_acumulado = sum(c.saldo_pendiente for c in creditos_cliente)

        if saldo_acumulado + nueva_deuda > tope:
            return Response({
                'error': f'El cliente supera el tope de crédito de ${tope:,.0f}. '
                         f'Deuda actual: ${saldo_acumulado:,.0f}. '
                         f'Disponible: ${tope - saldo_acumulado:,.0f}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ── Crear el crédito ──────────────────────────────
        usuario = Usuario.objects.get(pk=request.user.pk)
        credito = Credito.objects.create(
            tienda           = tienda,
            cliente_nombre   = data['cliente_nombre'],
            cliente_telefono = data.get('cliente_telefono', ''),
            total_deuda      = data['total_deuda'],
            notas            = data.get('notas', ''),
            usuario          = usuario,
            venta_id         = data.get('venta_id'),
        )

        return Response(
            CreditoSerializer(credito).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='abonar')
    def abonar(self, request, pk=None):
        credito    = self.get_object()
        serializer = AbonarCreditoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        monto_total = serializer.validated_data['monto']
        nota        = serializer.validated_data.get('nota', '')
        forma_pago  = serializer.validated_data.get('forma_pago', 'EFECTIVO')
        usuario     = Usuario.objects.get(pk=request.user.pk)

        # Obtener todos los créditos pendientes del cliente (misma tienda)
        pendientes = Credito.objects.filter(
            tienda               = credito.tienda,
            cliente_nombre__iexact = credito.cliente_nombre,
            estado               = 'PENDIENTE',
        ).order_by('created_at')  # del más antiguo al más reciente

        saldo_total = sum(c.saldo_pendiente for c in pendientes)

        if monto_total > saldo_total:
            return Response({
                'error': f'El monto supera el saldo pendiente de ${saldo_total:,.0f}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Distribuir el abono entre los créditos pendientes (del más antiguo al más nuevo)
        monto_restante = Decimal(str(monto_total))
        for c in pendientes:
            if monto_restante <= 0:
                break
            aplicar = min(monto_restante, c.saldo_pendiente)
            AbonoCredito.objects.create(
                credito    = c,
                monto      = aplicar,
                forma_pago = forma_pago,
                nota       = nota,
                usuario    = usuario,
            )
            c.total_abonado += aplicar
            if c.saldo_pendiente <= 0:
                c.estado = 'PAGADO'
            c.save()
            monto_restante -= aplicar
            
        credito.refresh_from_db()
        return Response(CreditoSerializer(credito).data)
    

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        tienda        = self.get_tienda()
        pendientes    = Credito.objects.filter(tienda=tienda, estado='PENDIENTE')
        creditos_list = list(pendientes)

        total_cartera  = sum(c.saldo_pendiente for c in creditos_list)
        total_clientes = pendientes.values('cliente_nombre').distinct().count()

        return Response({
            'total_cartera':  float(total_cartera),
            'total_creditos': pendientes.count(),
            'total_clientes': total_clientes,
            'tope_maximo':    float(getattr(settings, 'CREDITO_TOPE_MAXIMO', 50000)),
        })
    @action(detail=False, methods=['get'], url_path='resumen-periodo')
    def resumen_periodo(self, request):
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        tienda      = self.get_tienda()

        qs = Credito.objects.filter(tienda=tienda)
        if fecha_desde:
            qs = qs.filter(created_at__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(created_at__date__lte=fecha_hasta)

        total_creditos  = qs.count()
        total_otorgado  = float(qs.aggregate(t=Sum('total_deuda'))['t'] or 0)
        total_abonado   = float(qs.aggregate(t=Sum('total_abonado'))['t'] or 0)
        saldo_pendiente = total_otorgado - total_abonado
        clientes        = qs.values('cliente_nombre').distinct().count()

        # Abonos del período
        from .models import AbonoCredito
        
        abonos_qs = AbonoCredito.objects.filter(credito__tienda=tienda)
        if fecha_desde:
            abonos_qs = abonos_qs.filter(credito__created_at__date__gte=fecha_desde)
        if fecha_hasta:
            abonos_qs = abonos_qs.filter(credito__created_at__date__lte=fecha_hasta)

        total_abonos_periodo = float(abonos_qs.aggregate(t=Sum('monto'))['t'] or 0)

    
        return Response({
            'total_creditos':        total_creditos,
            'total_otorgado':        total_otorgado,
            'total_abonado_periodo': total_abonos_periodo,
            'saldo_pendiente':       saldo_pendiente,
            'total_clientes':        clientes,
        })
        
    @action(detail=False, methods=['get'], url_path='abonos-hoy')
    def abonos_hoy(self, request):
        from .models import AbonoCredito
        from datetime import datetime, timedelta
        import pytz

        bogota = pytz.timezone('America/Bogota')
        hoy    = datetime.now(bogota).date()
        tienda = self.get_tienda()

        desde = bogota.localize(datetime.strptime(str(hoy), '%Y-%m-%d'))
        hasta = bogota.localize(datetime.strptime(str(hoy), '%Y-%m-%d') + timedelta(days=1))

        abonos = AbonoCredito.objects.filter(
            credito__tienda = tienda,
            created_at__gte = desde,
            created_at__lt  = hasta,
        )

        total = float(abonos.aggregate(t=Sum('monto'))['t'] or 0)

        return Response({
            'fecha':        str(hoy),
            'total_abonos': total,
            'cantidad':     abonos.count(),
        })
    
    @action(detail=False, methods=['get'], url_path='clientes')
    def clientes(self, request):
        tienda = self.get_tienda()
        search = request.query_params.get('search', '')

        qs = Credito.objects.filter(tienda=tienda, estado='PENDIENTE')
        if search:
            qs = qs.filter(cliente_nombre__icontains=search)

        resultado = (
            qs.values('cliente_nombre', 'cliente_telefono')
            .annotate(
                suma_deuda=Sum('total_deuda'),
                suma_abonado=Sum('total_abonado'),
                total_creditos=Count('id'),
            )
            .order_by('cliente_nombre')
        )

        data = [
            {
                'cliente_nombre':   r['cliente_nombre'],
                'cliente_telefono': r['cliente_telefono'],
                'saldo_total':      float(r['suma_deuda'] or 0) - float(r['suma_abonado'] or 0),
                'total_creditos':   r['total_creditos'],
            }
            for r in resultado
        ]

        return Response(data)