# ============================================================
# 1. auditoria/serializers.py
# ============================================================
from rest_framework import serializers
from .models import Auditoria


class AuditoriaSerializer(serializers.ModelSerializer):
    accion_display = serializers.CharField(
        source='get_accion_display',
        read_only=True
    )

    class Meta:
        model  = Auditoria
        fields = (
            'id', 'fecha_hora',
            'usuario_id_ref', 'usuario_nombre',
            'accion', 'accion_display',
            'tabla_afectada', 'registro_id',
            'valor_anterior', 'valor_nuevo',
            'ip_dispositivo', 'detalle'
        )
        read_only_fields = '__all__'