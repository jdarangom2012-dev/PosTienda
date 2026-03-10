# ============================================================
# APP: ventas  →  ventas/admin.py
# ============================================================
from django.contrib import admin
from .models import FormaPago, Venta, VentaDetalle, VentaPago


@admin.register(FormaPago)
class FormaPagoAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'activa')
    list_editable = ('activa',)
    ordering      = ('nombre',)


# Inline para ver el detalle dentro de una venta
class VentaDetalleInline(admin.TabularInline):
    model       = VentaDetalle
    extra       = 0
    readonly_fields = ('producto', 'cantidad', 'precio_unit', 'descuento', 'subtotal')
    can_delete  = False

    def has_add_permission(self, request, obj=None):
        return False


# Inline para ver los pagos dentro de una venta
class VentaPagoInline(admin.TabularInline):
    model       = VentaPago
    extra       = 0
    readonly_fields = ('forma_pago', 'monto', 'referencia')
    can_delete  = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display  = (
        'id', 'fecha_hora', 'usuario',
        'subtotal', 'descuento', 'total', 'estado'
    )
    list_filter   = ('estado', 'fecha_hora', 'usuario')
    search_fields = ('id', 'usuario__username')
    ordering      = ('-fecha_hora',)
    readonly_fields = (
        'fecha_hora', 'usuario', 'subtotal',
        'descuento', 'total', 'created_at'
    )
    inlines       = [VentaDetalleInline, VentaPagoInline]

    # Las ventas no se crean desde el admin
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        # Solo el admin puede cambiar el estado (ej: cancelar)
        return request.user.is_superuser
