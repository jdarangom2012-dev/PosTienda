# ============================================================
# 4. ia/serializers.py
# ============================================================
from rest_framework import serializers
from .models import PrediccionStock


class PrediccionStockSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(
        source='producto.nombre',
        read_only=True
    )
    producto_codigo = serializers.CharField(
        source='producto.codigo_barras',
        read_only=True
    )
    stock_actual = serializers.SerializerMethodField()
    nivel_alerta = serializers.SerializerMethodField()

    class Meta:
        model  = PrediccionStock
        fields = (
            'id', 'producto', 'producto_nombre', 'producto_codigo',
            'stock_actual', 'fecha_prediccion', 'dias_para_agotarse',
            'cantidad_sugerida', 'nivel_confianza',
            'nivel_alerta', 'fecha_generada'
        )
        read_only_fields = '__all__'

    def get_stock_actual(self, obj):
        try:
            return float(obj.producto.inventario.cantidad_actual)
        except Exception:
            return 0

    def get_nivel_alerta(self, obj):
        if obj.dias_para_agotarse <= 3:
            return 'CRITICO'
        elif obj.dias_para_agotarse <= 7:
            return 'URGENTE'
        return 'NORMAL'


class ChatbotPreguntaSerializer(serializers.Serializer):
    """Serializer para recibir la pregunta del chatbot."""
    pregunta = serializers.CharField(max_length=500)

    def validate_pregunta(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "La pregunta debe tener al menos 3 caracteres."
            )
        return value.strip()