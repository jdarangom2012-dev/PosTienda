# ============================================================
# 2. auditoria/views.py
# ============================================================
from rest_framework              import viewsets, filters
from rest_framework.decorators   import action
from rest_framework.response     import Response
from rest_framework.permissions  import IsAuthenticated
from django.db.models            import Count
from .models      import Auditoria
from .serializers import AuditoriaSerializer


class AuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consulta de auditoría — Solo lectura total.

    GET /api/auditoria/                          → listar (paginado)
    GET /api/auditoria/{id}/                     → ver detalle
    GET /api/auditoria/?accion=LOGIN             → filtrar por acción
    GET /api/auditoria/?usuario=admin            → filtrar por usuario
    GET /api/auditoria/?tabla=productos          → filtrar por tabla
    GET /api/auditoria/?fecha_desde=2026-03-01   → filtrar por fecha
    GET /api/auditoria/?fecha_hasta=2026-03-04   → filtrar por fecha
    GET /api/auditoria/resumen/                  → resumen de actividad
    GET /api/auditoria/por-usuario/{nombre}/     → actividad de un usuario
    """
    queryset = Auditoria.objects.all().order_by('-fecha_hora')
    serializer_class   = AuditoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['usuario_nombre', 'detalle', 'tabla_afectada']

    def get_queryset(self):
        qs          = self.queryset
        accion      = self.request.query_params.get('accion')
        usuario     = self.request.query_params.get('usuario')
        tabla       = self.request.query_params.get('tabla')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if accion:
            qs = qs.filter(accion=accion)
        if usuario:
            qs = qs.filter(usuario_nombre__icontains=usuario)
        if tabla:
            qs = qs.filter(tabla_afectada=tabla)
        if fecha_desde:
            qs = qs.filter(fecha_hora__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_hora__date__lte=fecha_hasta)
        return qs

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        """
        Resumen de actividad del sistema.
        GET /api/auditoria/resumen/
        """
        from django.utils import timezone
        from datetime import timedelta

        hoy      = timezone.now().date()
        hace_7   = hoy - timedelta(days=6)

        # Acciones por tipo
        por_accion = Auditoria.objects.values('accion').annotate(
            total=Count('id')
        ).order_by('-total')

        # Actividad últimos 7 días
        por_dia = Auditoria.objects.filter(
            fecha_hora__date__gte=hace_7
        ).values('fecha_hora__date').annotate(
            total=Count('id')
        ).order_by('fecha_hora__date')

        # Usuarios más activos
        por_usuario = Auditoria.objects.values('usuario_nombre').annotate(
            total=Count('id')
        ).order_by('-total')[:5]

        # Tablas más modificadas
        por_tabla = Auditoria.objects.exclude(
            tabla_afectada__isnull=True
        ).values('tabla_afectada').annotate(
            total=Count('id')
        ).order_by('-total')

        return Response({
            'total_registros':    Auditoria.objects.count(),
            'por_accion':         list(por_accion),
            'actividad_7_dias':   list(por_dia),
            'usuarios_activos':   list(por_usuario),
            'tablas_modificadas': list(por_tabla),
        })

    @action(detail=False, methods=['get'], url_path='por-usuario/(?P<nombre>[^/.]+)')
    def por_usuario(self, request, nombre=None):
        """
        Actividad completa de un usuario.
        GET /api/auditoria/por-usuario/{nombre}/
        """
        registros  = self.queryset.filter(usuario_nombre__icontains=nombre)
        serializer = self.get_serializer(registros, many=True)
        return Response({
            'usuario':   nombre,
            'total':     registros.count(),
            'registros': serializer.data,
        })