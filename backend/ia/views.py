from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from openai import OpenAI
from decouple import config
from django.conf import settings


class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna estado de IA para la tienda."""
        tienda = getattr(request, 'tienda', None)
        if not tienda:
            return Response({'error': 'Tienda no encontrada.'}, status=400)

        tienda.reset_tokens_si_necesario()

        return Response({
            'plan'              : tienda.plan,
            'es_premium'        : tienda.es_premium,
            'tokens_disponibles': tienda.tokens_disponibles,
            'ia_tokens_mes'     : tienda.ia_tokens_mes,
            'ia_tokens_usados'  : tienda.ia_tokens_usados,
            'ia_reset_fecha'    : tienda.ia_reset_fecha,
        })

    def post(self, request):
        tienda = getattr(request, 'tienda', None)
        if not tienda:
            return Response({'error': 'Tienda no encontrada.'}, status=400)

        if not tienda.es_premium:
            return Response({'error': 'plan_basic', 'mensaje': 'Tu plan no tiene IA habilitada.'}, status=403)

        tienda.reset_tokens_si_necesario()
        if not tienda.tiene_tokens():
            return Response({
                'error': 'tokens_agotados',
                'mensaje': f'Tokens agotados. Reset el {tienda.ia_reset_fecha}.',
                'reset_fecha': tienda.ia_reset_fecha,
            }, status=429)

        mensaje = request.data.get('mensaje', '').strip()
        if not mensaje:
            return Response({'error': 'Mensaje vacío.'}, status=400)

        # ── Recopilar contexto real de la tienda ──────────────
        from productos.models import Producto
        from ventas.models import Venta, VentaDetalle
        from inventario.models import Inventario
        from django.utils import timezone
        from django.db.models import Sum, Count

        hoy = timezone.now().date()

        # Productos activos
        productos = Producto.objects.filter(tienda=tienda, activo=True).select_related('categoria', 'inventario')
        total_productos = productos.count()

        # Stock bajo
        stock_bajo = [
            f"{p.nombre} (stock: {p.inventario.cantidad_actual if hasattr(p, 'inventario') else 0})"
            for p in productos
            if hasattr(p, 'inventario') and p.inventario.cantidad_actual <= p.stock_minimo
        ]

        # Ventas de hoy
        ventas_hoy = Venta.objects.filter(tienda=tienda, fecha_hora__date=hoy)
        total_ventas_hoy = ventas_hoy.aggregate(total=Sum('total'))['total'] or 0
        num_ventas_hoy   = ventas_hoy.count()

        # Productos más vendidos (últimos 30 días)
        hace_30 = timezone.now() - timezone.timedelta(days=30)
        mas_vendidos = (
            VentaDetalle.objects
            .filter(venta__tienda=tienda, venta__fecha_hora__gte=hace_30)
            .values('producto__nombre')
            .annotate(total=Sum('cantidad'))
            .order_by('-total')[:5]
        )
        mas_vendidos_str = ', '.join([f"{v['producto__nombre']} ({v['total']} uds)" for v in mas_vendidos]) or 'Sin datos'

        contexto = f"""
    Eres el asistente IA de la tienda "{tienda.nombre}".
    Tienes acceso a los siguientes datos REALES de la tienda:

    - Total productos activos: {total_productos}
    - Ventas de hoy: {num_ventas_hoy} ventas por un total de ${total_ventas_hoy:,.0f}
    - Productos más vendidos (últimos 30 días): {mas_vendidos_str}
    - Productos con stock bajo: {', '.join(stock_bajo) if stock_bajo else 'Ninguno'}

    Responde siempre en español, de forma concisa y usando los datos reales anteriores.
    Si te preguntan algo que no está en los datos disponibles, dilo claramente.
    """

        try:
            from django.conf import settings
            client   = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model    = 'gpt-3.5-turbo',
                messages = [
                    {'role': 'system', 'content': contexto},
                    {'role': 'user',   'content': mensaje}
                ],
                max_tokens = 500,
            )
            tienda.consumir_token()
            return Response({
                'respuesta'         : response.choices[0].message.content,
                'tokens_disponibles': tienda.tokens_disponibles,
                'tokens_usados'     : tienda.ia_tokens_usados,
            })
        except Exception as e:
            print(f"DEBUG ERROR: {e}")
            return Response({'error': str(e)}, status=500)