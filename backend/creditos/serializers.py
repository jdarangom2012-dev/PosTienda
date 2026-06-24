# creditos/serializers.py
from rest_framework import serializers
from .models import Credito, AbonoCredito


class AbonoCreditoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre_completo', read_only=True)

    class Meta:
        model  = AbonoCredito
        fields = ('id', 'monto', 'forma_pago', 'nota', 'usuario_nombre', 'created_at')
        read_only_fields = ('id', 'usuario_nombre', 'created_at')

class CreditoSerializer(serializers.ModelSerializer):
    abonos          = AbonoCreditoSerializer(many=True, read_only=True)
    saldo_pendiente = serializers.ReadOnlyField()
    esta_pagado     = serializers.ReadOnlyField()
    usuario_nombre  = serializers.CharField(source='usuario.nombre_completo', read_only=True)
    productos_venta = serializers.SerializerMethodField()

    def get_productos_venta(self, obj):
        if not obj.venta_id:
            return []
        try:
            detalles = obj.venta.detalle.select_related('producto').all()
            return [
                {
                    'nombre':   d.producto.nombre,
                    'cantidad': float(d.cantidad),
                    'precio':   float(d.precio_unit),
                }
                for d in detalles
            ]
        except Exception:
            return []

    class Meta:
        model  = Credito
        fields = (
            'id', 'cliente_nombre', 'cliente_telefono',
            'total_deuda', 'total_abonado', 'saldo_pendiente',
            'estado', 'esta_pagado', 'notas',
            'usuario_nombre', 'venta',
            'productos_venta',
            'abonos', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'total_abonado', 'estado', 'created_at', 'updated_at')


# ← Fuera de CreditoSerializer, al mismo nivel
class CrearCreditoSerializer(serializers.Serializer):
    cliente_nombre   = serializers.CharField(max_length=200)
    cliente_telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    total_deuda      = serializers.DecimalField(max_digits=12, decimal_places=2)
    notas            = serializers.CharField(required=False, allow_blank=True)
    venta_id         = serializers.IntegerField(required=False, allow_null=True)

    def validate_total_deuda(self, value):
        if value <= 0:
            raise serializers.ValidationError("El valor debe ser mayor a 0.")
        return value


class AbonarCreditoSerializer(serializers.Serializer):
    monto      = serializers.DecimalField(max_digits=12, decimal_places=2)
    forma_pago = serializers.ChoiceField(choices=['EFECTIVO', 'NEQUI', 'OTRO'], default='EFECTIVO')
    nota       = serializers.CharField(required=False, allow_blank=True)

    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0.")
        return value