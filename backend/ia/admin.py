# ============================================================
# APP: ia  →  ia/admin.py
# ============================================================
from django.contrib import admin
from .models import PrediccionStock


@admin.register(PrediccionStock)
class PrediccionStockAdmin(admin.ModelAdmin):
    list_display = (
        'producto', 'dias_para_agotarse', 'estado_alerta',
        'cantidad_sugerida', 'nivel_confianza', 'fecha_generada'
    )
    list_filter   = ('fecha_generada',)
    search_fields = ('producto__nombre',)
    ordering      = ('dias_para_agotarse',)
    readonly_fields = (
        'producto', 'fecha_prediccion', 'dias_para_agotarse',
        'cantidad_sugerida', 'nivel_confianza', 'fecha_generada'
    )

    def estado_alerta(self, obj):
        if obj.dias_para_agotarse <= 3:
            return '🔴 Crítico'
        elif obj.dias_para_agotarse <= 7:
            return '🟡 Urgente'
        return '🟢 Normal'
    estado_alerta.short_description = 'Alerta'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


