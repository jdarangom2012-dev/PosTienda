# ============================================================
# API REST — APP: usuarios
# Sistema POS
# ============================================================
# Archivos:
#   usuarios/serializers.py
#   usuarios/views.py
#   usuarios/urls.py
#   config/urls.py  (urls principal)
# ============================================================


# ============================================================
# 1. usuarios/serializers.py
# ============================================================
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, Tienda



class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer general para leer datos de usuario.
    No expone la contraseña.
    """
    rol_display = serializers.CharField(
        source='get_rol_display',
        read_only=True
    )

    class Meta:
        model  = Usuario
        fields = (
            'id', 'username', 'nombre_completo',
            'email', 'rol', 'rol_display',
            'is_active', 'last_login', 'date_joined'
        )
        read_only_fields = ('id', 'last_login', 'date_joined')


class UsuarioCrearSerializer(serializers.ModelSerializer):
    """
    Serializer para crear un usuario nuevo con contraseña.
    """
    password  = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirmar contraseña'
    )

    class Meta:
        model  = Usuario
        fields = (
            'username', 'nombre_completo',
            'email', 'rol', 'password', 'password2'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': 'Las contraseñas no coinciden.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        usuario  = Usuario(**validated_data)
        usuario.set_password(password)   # encripta con bcrypt
        usuario.save()
        return usuario


class CambiarPasswordSerializer(serializers.Serializer):
    """
    Serializer para cambiar la contraseña del usuario autenticado.
    """
    password_actual = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_nuevo  = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_nuevo2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['password_actual']):
            raise serializers.ValidationError(
                {'password_actual': 'La contraseña actual es incorrecta.'}
            )
        if attrs['password_nuevo'] != attrs['password_nuevo2']:
            raise serializers.ValidationError(
                {'password_nuevo': 'Las contraseñas nuevas no coinciden.'}
            )
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['password_nuevo'])
        user.save()
        return user


class PerfilSerializer(serializers.ModelSerializer):
    """
    Serializer para que el usuario edite su propio perfil.
    No permite cambiar rol ni username.
    """
    class Meta:
        model  = Usuario
        fields = ('id', 'username', 'nombre_completo', 'email', 'rol', 'last_login')
        read_only_fields = ('id', 'username', 'rol', 'last_login')


class TiendaSerializer(serializers.ModelSerializer):
    tokens_disponibles = serializers.ReadOnlyField()
    es_premium         = serializers.ReadOnlyField()

    class Meta:
        model  = Tienda
        fields = [
            'id', 'codigo', 'nombre', 'activa',
            'plan', 'ia_activa', 'ia_tokens_mes',
            'ia_tokens_usados', 'ia_reset_fecha',
            'tokens_disponibles', 'es_premium',
        ]