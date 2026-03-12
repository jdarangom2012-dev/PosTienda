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
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter
from .serializers import UsuarioSerializer, UsuarioCrearSerializer, TiendaSerializer


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
class UsuarioViewSet(viewsets.ModelViewSet):  # ← quitar TiendaMixin
    queryset           = Usuario.objects.all().order_by('id')
    serializer_class   = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [SearchFilter]
    search_fields      = ['username', 'nombre_completo', 'email']

    def get_queryset(self):
        qs   = Usuario.objects.all().order_by('id')
        user = self.request.user
        rol  = self.request.query_params.get('rol', '')
        
        if user.es_superadmin:
            qs = qs.exclude(rol='SUPERADMIN')
       
        else:
            tienda = getattr(self.request, 'tienda', None)
       
            qs = qs.filter(tienda=tienda).exclude(rol='SUPERADMIN') if tienda else qs.none()

        if rol:
            qs = qs.filter(rol=rol)
       

        return qs
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCrearSerializer
        return UsuarioSerializer

    def perform_create(self, serializer):
        user      = self.request.user
        tienda_id = self.request.data.get('tienda')
        if user.es_superadmin:
            tienda = Tienda.objects.get(id=tienda_id) if tienda_id else None
            serializer.save(tienda=tienda)
        else:
            raise PermissionDenied('No tienes permiso para crear usuarios.')

    def get_permissions(self):
        if self.request.user.rol not in ['SUPERADMIN']:  # ← solo SUPERADMIN
            raise PermissionDenied('No tienes permiso para gestionar usuarios.')
        return super().get_permissions()

    def perform_create(self, serializer):
        user   = self.request.user
        if not user.es_superadmin:
            raise PermissionDenied('Solo el Superadmin puede crear usuarios.')
        serializer.save()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCrearSerializer
        return UsuarioSerializer


# ── Tiendas (solo superadmin) ─────────────────────────────────
class TiendaViewSet(viewsets.ModelViewSet):
    queryset           = Tienda.objects.all()
    permission_classes = [IsAuthenticated, EsSuperAdmin]
    serializer_class   = TiendaSerializer

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        tienda        = self.get_object()
        tienda.activa = True
        tienda.save()
        return Response({'mensaje': f'Tienda "{tienda.nombre}" activada.'})

    @action(detail=True, methods=['post'], url_path='desactivar')
    def desactivar(self, request, pk=None):
        tienda        = self.get_object()
        tienda.activa = False
        tienda.save()
        return Response({'mensaje': f'Tienda "{tienda.nombre}" desactivada.'})

    @action(detail=True, methods=['get'], url_path='usuarios')
    def usuarios(self, request, pk=None):
        tienda   = self.get_object()
        usuarios = Usuario.objects.filter(tienda=tienda)
        return Response(UsuarioSerializer(usuarios, many=True).data)

    @action(detail=True, methods=['post'], url_path='cambiar-plan')
    def cambiar_plan(self, request, pk=None):
        tienda      = self.get_object()
        plan        = request.data.get('plan')
        ia_activa   = request.data.get('ia_activa')
        ia_tokens   = request.data.get('ia_tokens_mes')
        if plan:        tienda.plan          = plan
        if ia_activa is not None: tienda.ia_activa = ia_activa
        if ia_tokens:   tienda.ia_tokens_mes = ia_tokens
        tienda.save()
        return Response(TiendaSerializer(tienda).data)