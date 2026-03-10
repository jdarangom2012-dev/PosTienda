# ============================================================
# APP: inventario  →  inventario/admin.py
# ============================================================
from django.contrib import admin
from .models import Inventario, MovimientoInventario


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display  = ('producto', 'cantidad_actual', 'alerta_stock', 'updated_at')
    search_fields = ('producto__nombre', 'producto__codigo_barras')
    ordering      = ('producto__nombre',)
    readonly_fields = ('updated_at',)

    def alerta_stock(self, obj):
        if obj.cantidad_actual <= obj.producto.stock_minimo:
            return '⚠️ Stock bajo'
        return '✅ OK'
    alerta_stock.short_description = 'Estado'


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        'created_at', 'producto', 'tipo_movimiento',
        'cantidad', 'stock_anterior', 'stock_nuevo', 'usuario'
    )
    list_filter   = ('tipo_movimiento', 'referencia_tipo')
    search_fields = ('producto__nombre', 'usuario__username', 'motivo')
    ordering      = ('-created_at',)
    readonly_fields = (
        'producto', 'tipo_movimiento', 'cantidad',
        'stock_anterior', 'stock_nuevo', 'usuario',
        'referencia_id', 'referencia_tipo', 'created_at'
    )

    # Los movimientos no se deben editar manualmente
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
