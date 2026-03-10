# ============================================================
# APP: auditoria  →  auditoria/admin.py
# ============================================================
from django.contrib import admin
from .models import Auditoria


@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    list_display = (
        'fecha_hora', 'usuario_nombre', 'accion',
        'tabla_afectada', 'registro_id', 'ip_dispositivo'
    )
    list_filter   = ('accion', 'tabla_afectada', 'fecha_hora')
    search_fields = ('usuario_nombre', 'detalle', 'tabla_afectada')
    ordering      = ('-fecha_hora',)
    readonly_fields = (
        'fecha_hora', 'usuario_id_ref', 'usuario_nombre',
        'accion', 'tabla_afectada', 'registro_id',
        'valor_anterior', 'valor_nuevo',
        'ip_dispositivo', 'detalle'
    )

    # La auditoría es solo lectura — sin add, edit ni delete
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False