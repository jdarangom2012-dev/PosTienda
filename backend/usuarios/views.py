# ============================================================
# usuarios/views.py
# ============================================================
from rest_framework              import viewsets, status, generics
from rest_framework.decorators   import action
from rest_framework.response     import Response
from rest_framework.permissions  import IsAuthenticated, AllowAny
from rest_framework.views        import APIView
from rest_framework_simplejwt.tokens      import RefreshToken
from rest_framework_simplejwt.views       import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework                       import serializers
from .models      import Usuario, Tienda
from .serializers import (
    UsuarioSerializer, UsuarioCrearSerializer,
    CambiarPasswordSerializer, PerfilSerializer
)
from .mixins import TiendaMixin


# ── Permisos ─────────────────────────────────────────────────
class EsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and getattr(request.user, 'rol', None) in ('ADMIN', 'SUPERADMIN')
        )


class EsSuperAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and getattr(request.user, 'es_superadmin', False)
        )


# ── JWT personalizado ─────────────────────────────────────────
class CustomTokenSerializer(TokenObtainPairSerializer):
    codigo_tienda = serializers.CharField(write_only=True)

    def validate(self, attrs):
        codigo = attrs.pop('codigo_tienda', '').strip().upper()

        try:
            tienda = Tienda.objects.get(codigo=codigo, activa=True)
        except Tienda.DoesNotExist:
            raise serializers.ValidationError(
                {'codigo_tienda': 'Código de tienda inválido o tienda inactiva.'}
            )

        data    = super().validate(attrs)
        usuario = self.user

        if not usuario.es_superadmin and usuario.tienda_id != tienda.id:
            raise serializers.ValidationError(
                {'detail': 'Este usuario no pertenece a esa tienda.'}
            )

        token              = self.get_token(usuario)
        token['tienda_id'] = tienda.id
        token['rol']       = getattr(usuario, 'rol', 'CAJERO')

        data['access']  = str(token.access_token)
        data['usuario'] = {
            'id':             usuario.id,
            'username':       usuario.username,
            'nombre_completo':getattr(usuario, 'nombre_completo', usuario.username),
            'rol':            getattr(usuario, 'rol', 'CAJERO'),
            'tienda_id':      tienda.id,
            'tienda_nombre':  tienda.nombre,
            'tienda_codigo':  tienda.codigo,
        }
        return data


class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer


class LoginView(TokenObtainPairView):
    serializer_class   = CustomTokenSerializer
    permission_classes = [AllowAny]


# ── Logout ────────────────────────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Se requiere el refresh token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'mensaje': 'Sesión cerrada correctamente.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── Perfil ────────────────────────────────────────────────────
class PerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(PerfilSerializer(request.user).data)

    def put(self, request):
        serializer = PerfilSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Cambiar contraseña ────────────────────────────────────────
class CambiarPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'mensaje': 'Contraseña actualizada correctamente.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Usuarios (CRUD por tienda) ────────────────────────────────
class UsuarioViewSet(TiendaMixin, viewsets.ModelViewSet):
    queryset           = Usuario.objects.all().order_by('username')
    permission_classes = [EsAdmin]

    def get_queryset(self):
        # TiendaMixin filtra por tienda automáticamente
        qs     = super().get_queryset()
        search = self.request.query_params.get('search', '')
        rol    = self.request.query_params.get('rol', '')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(nombre_completo__icontains=search) |
                Q(email__icontains=search)
            )
        if rol:
            qs = qs.filter(rol=rol)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCrearSerializer
        return UsuarioSerializer

    def perform_create(self, serializer):
        tienda = self.get_tienda()
        serializer.save(tienda=tienda)

    def destroy(self, request, *args, **kwargs):
        usuario           = self.get_object()
        usuario.is_active = False
        usuario.save()
        return Response(
            {'mensaje': f'Usuario {usuario.username} desactivado correctamente.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        usuario           = self.get_object()
        usuario.is_active = True
        usuario.save()
        return Response({'mensaje': f'Usuario {usuario.username} activado.'})

    @action(detail=True, methods=['post'], url_path='desactivar')
    def desactivar(self, request, pk=None):
        usuario = self.get_object()
        if usuario == request.user:
            return Response(
                {'error': 'No puedes desactivarte a ti mismo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        usuario.is_active = False
        usuario.save()
        return Response({'mensaje': f'Usuario {usuario.username} desactivado.'})

    @action(detail=False, methods=['get'], url_path='por-rol')
    def por_rol(self, request):
        rol = request.query_params.get('rol')
        qs  = self.get_queryset().filter(is_active=True)
        if rol:
            qs = qs.filter(rol=rol)
        return Response(UsuarioSerializer(qs, many=True).data)


# ── Tiendas (solo superadmin) ─────────────────────────────────
class TiendaViewSet(viewsets.ModelViewSet):
    queryset           = Tienda.objects.all().order_by('nombre')
    permission_classes = [EsSuperAdmin]

    def get_serializer_class(self):
        from .serializers import TiendaSerializer
        return TiendaSerializer

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        tienda        = self.get_object()
        tienda.activa = True
        tienda.save()
        return Response({'mensaje': f'Tienda {tienda.nombre} activada.'})

    @action(detail=True, methods=['post'], url_path='desactivar')
    def desactivar(self, request, pk=None):
        tienda        = self.get_object()
        tienda.activa = False
        tienda.save()
        return Response({'mensaje': f'Tienda {tienda.nombre} desactivada.'})