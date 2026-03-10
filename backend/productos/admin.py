# ============================================================
# APP: productos  →  productos/admin.py
# ============================================================
from django.contrib import admin
from .models import Categoria, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'activa', 'total_productos', 'created_at')
    list_filter   = ('activa',)
    search_fields = ('nombre',)
    list_editable = ('activa',)
    ordering      = ('nombre',)

    def total_productos(self, obj):
        return obj.productos.filter(activo=True).count()
    total_productos.short_description = 'Productos activos'


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'codigo_barras', 'categoria',
        'precio_costo', 'precio_venta', 'margen',
        'stock_actual', 'stock_minimo', 'activo'
    )
    list_filter   = ('categoria', 'activo', 'unidad_medida')
    search_fields = ('nombre', 'codigo_barras', 'descripcion')
    list_editable = ('precio_venta', 'activo')
    ordering      = ('nombre',)
    readonly_fields = ('created_at', 'updated_at')

    # Agrupar campos en secciones dentro del formulario
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'codigo_barras', 'descripcion', 'categoria', 'unidad_medida', 'imagen_url')
        }),
        ('Precios', {
            'fields': ('precio_costo', 'precio_venta'),
        }),
        ('Inventario', {
            'fields': ('stock_minimo', 'activo'),
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def margen(self, obj):
        if obj.precio_costo and obj.precio_costo > 0:
            m = ((obj.precio_venta - obj.precio_costo) / obj.precio_costo) * 100
            return f"{m:.1f}%"
        return "—"
    margen.short_description = 'Margen'

    def stock_actual(self, obj):
        try:
            stock = obj.inventario.cantidad_actual
            if stock <= obj.stock_minimo:
                return f"⚠️ {stock}"
            return stock
        except Exception:
            return "Sin registro"
    stock_actual.short_description = 'Stock actual'
