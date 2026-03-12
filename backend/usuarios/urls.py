# ============================================================
# 3. usuarios/urls.py
# ============================================================
from django.urls         import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, LogoutView, PerfilView,
    CambiarPasswordView, UsuarioViewSet, TiendaViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'tiendas',  TiendaViewSet,  basename='tienda')

urlpatterns = [
    # Auth
    path('login/',            LoginView.as_view(),          name='login'),
    path('logout/',           LogoutView.as_view(),          name='logout'),
    path('token/refresh/',    TokenRefreshView.as_view(),    name='token_refresh'),

    # Perfil del usuario autenticado
    path('perfil/',           PerfilView.as_view(),          name='perfil'),
    path('cambiar-password/', CambiarPasswordView.as_view(), name='cambiar_password'),

    # CRUD de usuarios (solo admin)
    path('', include(router.urls)),
]


