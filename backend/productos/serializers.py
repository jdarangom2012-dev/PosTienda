# ============================================================
# API REST — APP: productos
# Sistema POS
# ============================================================
# Archivos:
#   productos/serializers.py
#   productos/views.py
#   productos/urls.py
# ============================================================


# ============================================================
# 1. productos/serializers.py
# ============================================================
from rest_framework import serializers
from .models import Categoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    total_productos = serializers.SerializerMethodField()

    class Meta:
        model  = Categoria
        fields = ('id', 'nombre', 'descripcion', 'activa', 'total_productos', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_total_productos(self, obj):
        return obj.productos.filter(activo=True).count()


class ProductoSerializer(serializers.ModelSerializer):
    """
    Serializer completo — usado para crear y editar productos.
    """
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )
    margen_ganancia = serializers.SerializerMethodField()
    stock_actual    = serializers.SerializerMethodField()
    bajo_minimo     = serializers.SerializerMethodField()

    class Meta:
        model  = Producto
        fields = (
            'id', 'codigo_barras', 'nombre', 'descripcion',
            'categoria', 'categoria_nombre',
            'precio_costo', 'precio_venta', 'margen_ganancia',
            'unidad_medida', 'imagen_url', 'stock_minimo',
            'stock_actual', 'bajo_minimo',
            'activo', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_margen_ganancia(self, obj):
        if obj.precio_costo and obj.precio_costo > 0:
            return round(
                float((obj.precio_venta - obj.precio_costo) / obj.precio_costo * 100), 2
            )
        return 0

    def get_stock_actual(self, obj):
        try:
            return float(obj.inventario.cantidad_actual)
        except Exception:
            return 0

    def get_bajo_minimo(self, obj):
        try:
            return obj.inventario.cantidad_actual <= obj.stock_minimo
        except Exception:
            return False

    def validate_precio_venta(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio de venta debe ser mayor a 0.")
        return value

    def validate_precio_costo(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio de costo no puede ser negativo.")
        return value

    def validate(self, attrs):
        precio_costo = attrs.get('precio_costo', 0)
        precio_venta = attrs.get('precio_venta', 0)
        if precio_venta < precio_costo:
            raise serializers.ValidationError(
                {'precio_venta': 'El precio de venta no puede ser menor al precio de costo.'}
            )
        return attrs


class ProductoListSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    stock_actual     = serializers.SerializerMethodField()
    bajo_minimo      = serializers.SerializerMethodField()

    class Meta:
        model  = Producto
        fields = (
            'id', 'codigo_barras', 'nombre',
            'categoria', 'categoria_nombre',   # ← agrega 'categoria'
            'precio_costo', 'precio_venta',    # ← agrega 'precio_costo'
            'unidad_medida', 'imagen_url',
            'stock_minimo',                    # ← agrega 'stock_minimo'
            'stock_actual', 'bajo_minimo', 'activo'
        )

    def get_stock_actual(self, obj):
        try:
            return float(obj.inventario.cantidad_actual)
        except Exception:
            return 0

    def get_bajo_minimo(self, obj):
        try:
            return obj.inventario.cantidad_actual <= obj.stock_minimo
        except Exception:
            return False


class ProductoBusquedaSerializer(serializers.ModelSerializer):
    """
    Serializer mínimo para la búsqueda rápida en el POS.
    Solo los datos que necesita la pantalla de caja.
    """
    stock_actual = serializers.SerializerMethodField()

    class Meta:
        model  = Producto
        fields = (
            'id', 'codigo_barras', 'nombre',
            'precio_venta', 'unidad_medida',
            'imagen_url', 'stock_actual'
        )

    def get_stock_actual(self, obj):
        try:
            return float(obj.inventario.cantidad_actual)
        except Exception:
            return 0
class CategoriaSerializer(serializers.ModelSerializer):
    total_productos = serializers.SerializerMethodField()

    class Meta:
        model  = Categoria
        fields = ('id', 'nombre', 'descripcion', 'activa', 'total_productos')

    def get_total_productos(self, obj):
        return obj.productos.filter(activo=True).count()