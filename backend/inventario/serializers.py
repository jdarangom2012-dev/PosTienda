# ============================================================
# API REST — APP: inventario
# Sistema POS
# ============================================================
# Archivos:
#   inventario/serializers.py
#   inventario/views.py
#   inventario/urls.py
# ============================================================


# ============================================================
# 1. inventario/serializers.py
# ============================================================
from rest_framework import serializers
from .models import Inventario, MovimientoInventario


class InventarioSerializer(serializers.ModelSerializer):
    """
    Serializer para ver el stock actual de un producto.
    """
    producto_nombre  = serializers.CharField(source='producto.nombre',       read_only=True)
    producto_codigo  = serializers.CharField(source='producto.codigo_barras', read_only=True)
    stock_minimo     = serializers.IntegerField(source='producto.stock_minimo', read_only=True)
    bajo_minimo      = serializers.SerializerMethodField()

    class Meta:
        model  = Inventario
        fields = (
            'id', 'producto', 'producto_nombre', 'producto_codigo',
            'cantidad_actual', 'stock_minimo', 'bajo_minimo', 'updated_at'
        )
        read_only_fields = ('id', 'updated_at')

    def get_bajo_minimo(self, obj):
        return obj.cantidad_actual <= obj.producto.stock_minimo


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    """
    Serializer para leer movimientos de inventario.
    """
    producto_nombre  = serializers.CharField(source='producto.nombre',   read_only=True)
    usuario_nombre   = serializers.CharField(source='usuario.username',  read_only=True)
    tipo_display     = serializers.CharField(source='get_tipo_movimiento_display', read_only=True)

    class Meta:
        model  = MovimientoInventario
        fields = (
            'id', 'producto', 'producto_nombre',
            'tipo_movimiento', 'tipo_display',
            'cantidad', 'stock_anterior', 'stock_nuevo',
            'referencia_id', 'referencia_tipo',
            'motivo', 'usuario', 'usuario_nombre', 'created_at'
        )
        read_only_fields = '__all__'


class EntradaMercanciaSerializer(serializers.Serializer):
    """
    Serializer para registrar una entrada de mercancía.
    Usado cuando llega mercancía del proveedor.
    """
    producto_id = serializers.IntegerField()
    cantidad    = serializers.DecimalField(max_digits=12, decimal_places=2)
    motivo      = serializers.CharField(
        max_length=500,
        required=False,
        default='Entrada de mercancía'
    )

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0.")
        return value

    def validate_producto_id(self, value):
        from productos.models import Producto
        try:
            Producto.objects.get(id=value, activo=True)
        except Producto.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado o inactivo.")
        return value


class AjusteInventarioSerializer(serializers.Serializer):
    """
    Serializer para ajustes manuales de inventario.
    Requiere motivo obligatorio para auditoría.
    """
    producto_id      = serializers.IntegerField()
    cantidad_nueva   = serializers.DecimalField(max_digits=12, decimal_places=2)
    motivo           = serializers.CharField(max_length=500)

    def validate_cantidad_nueva(self, value):
        if value < 0:
            raise serializers.ValidationError("La cantidad no puede ser negativa.")
        return value

    def validate_producto_id(self, value):
        from productos.models import Producto
        try:
            Producto.objects.get(id=value, activo=True)
        except Producto.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado o inactivo.")
        return value
