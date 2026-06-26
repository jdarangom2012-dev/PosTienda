# ============================================================
# API REST — APP: ventas
# Sistema POS
# ============================================================
# Archivos:
#   ventas/serializers.py
#   ventas/views.py
#   ventas/urls.py
# ============================================================


# ============================================================
# 1. ventas/serializers.py
# ============================================================
from rest_framework import serializers
from decimal import Decimal
from .models import FormaPago, Venta, VentaDetalle, VentaPago
from productos.models import Producto
from inventario.models import Inventario

class FormaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FormaPago
        fields = ('id', 'nombre', 'activa')


# ── Serializers de lectura (para mostrar detalle de venta) ───

class VentaDetalleReadSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre',      read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo_barras', read_only=True)

    class Meta:
        model  = VentaDetalle
        fields = (
            'id', 'producto', 'producto_nombre', 'producto_codigo',
            'cantidad', 'precio_unit', 'descuento', 'subtotal'
        )


class VentaPagoReadSerializer(serializers.ModelSerializer):
    forma_pago_nombre = serializers.CharField(source='forma_pago.nombre', read_only=True)

    class Meta:
        model  = VentaPago
        fields = ('id', 'forma_pago', 'forma_pago_nombre', 'monto', 'referencia')


class VentaReadSerializer(serializers.ModelSerializer):
    """Serializer completo para leer una venta con todo su detalle."""
    cajero        = serializers.CharField(source='usuario.username',         read_only=True)
    cajero_nombre = serializers.CharField(source='usuario.nombre_completo',  read_only=True)
    estado_display = serializers.CharField(source='get_estado_display',      read_only=True)
    detalle       = VentaDetalleReadSerializer(many=True, read_only=True)
    pagos         = VentaPagoReadSerializer(many=True, read_only=True)
    total_pagado  = serializers.SerializerMethodField()
    cambio        = serializers.SerializerMethodField()

    class Meta:
        model  = Venta
        fields = (
            'id', 'fecha_hora', 'cajero', 'cajero_nombre',
            'subtotal', 'descuento', 'total',
            'total_pagado', 'cambio',
            'estado', 'estado_display', 'motivo_cancelacion',
            'detalle', 'pagos', 'created_at'
        )

    def get_total_pagado(self, obj):
        return float(sum(p.monto for p in obj.pagos.all()))

    def get_cambio(self, obj):
        total_pagado = sum(p.monto for p in obj.pagos.all())
        cambio = total_pagado - obj.total
        return float(cambio) if cambio > 0 else 0


# ── Serializers de escritura (para crear una venta) ──────────

class VentaDetalleWriteSerializer(serializers.Serializer):
    """Una línea del ticket al momento de crear la venta."""
    producto_id = serializers.IntegerField()
    cantidad    = serializers.DecimalField(max_digits=12, decimal_places=2)
    descuento   = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        required=False, default=Decimal('0.00')
    )

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0.")
        return value

    def validate_descuento(self, value):
        if value < 0:
            raise serializers.ValidationError("El descuento no puede ser negativo.")
        return value


class VentaPagoWriteSerializer(serializers.Serializer):
    """Un pago al momento de crear la venta."""
    forma_pago_id = serializers.IntegerField()
    monto         = serializers.DecimalField(max_digits=12, decimal_places=2)
    referencia    = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0.")
        return value


class CrearVentaSerializer(serializers.Serializer):
    """
    Serializer principal para crear una venta completa.
    Valida productos, stock, pagos y totales.
    """
    detalle = VentaDetalleWriteSerializer(many=True)
    pagos   = VentaPagoWriteSerializer(many=True)

    def validate_detalle(self, value):
        if not value:
            raise serializers.ValidationError("La venta debe tener al menos un producto.")
        return value

    def validate_pagos(self, value):
        if not value:
            raise serializers.ValidationError("La venta debe tener al menos una forma de pago.")
        return value
    

    def validate(self, attrs):
        detalle = attrs['detalle']
        pagos   = attrs['pagos']

        # Validar que los productos existen y tienen stock
        for linea in detalle:
            try:
                producto = Producto.objects.get(id=linea['producto_id'], activo=True)
            except Producto.DoesNotExist:
                raise serializers.ValidationError(
                    {'detalle': f'Producto ID {linea["producto_id"]} no encontrado.'}
                )

            try:
                inv = Inventario.objects.get(producto=producto)
                stock = inv.cantidad_actual
            except Inventario.DoesNotExist:
                raise serializers.ValidationError(
                {'detalle': f'El producto "{producto.nombre}" no tiene registro de inventario.'}
            )

            if stock < linea['cantidad']:
                raise serializers.ValidationError({
                    'detalle': (
                        f'Stock insuficiente para "{producto.nombre}". '
                        f'Disponible: {stock}, solicitado: {linea["cantidad"]}.'
                    )
                })

        # Validar que las formas de pago existen
        for pago in pagos:
            try:
                FormaPago.objects.get(id=pago['forma_pago_id'])
            except FormaPago.DoesNotExist:
                raise serializers.ValidationError(
                    {'pagos': f'Forma de pago ID {pago["forma_pago_id"]} no encontrada.'}
                )

        # Calcular total de la venta
        total_venta = Decimal('0.00')
        for linea in detalle:
            producto    = Producto.objects.get(id=linea['producto_id'])
            precio_unit = producto.precio_venta
            subtotal    = (precio_unit * linea['cantidad']) - linea.get('descuento', Decimal('0.00'))
            total_venta += subtotal

        # Validar que el total pagado cubre el total de la venta
        total_pagado = sum(p['monto'] for p in pagos)
        if total_pagado < total_venta:
            raise serializers.ValidationError({
                'pagos': (
                    f'El monto pagado (${total_pagado}) es insuficiente. '
                    f'Total de la venta: ${total_venta}.'
                )
            })

        return attrs


class CancelarVentaSerializer(serializers.Serializer):
    """Serializer para cancelar una venta existente."""
    motivo = serializers.CharField(max_length=500)

    def validate_motivo(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError(
                "El motivo debe tener al menos 5 caracteres."
            )
        return value.strip()
