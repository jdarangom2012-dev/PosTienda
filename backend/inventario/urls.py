# ============================================================
# 3. inventario/urls.py  (reemplaza el archivo vacío)
# ============================================================
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InventarioViewSet, MovimientoViewSet,
    EntradaMercanciaView, AjusteInventarioView
)

router = DefaultRouter()
router.register(r'movimientos', MovimientoViewSet, basename='movimiento')
router.register(r'',            InventarioViewSet, basename='inventario')

urlpatterns = [
    # Acciones especiales
    path('entrada/', EntradaMercanciaView.as_view(), name='entrada_mercancia'),
    path('ajuste/',  AjusteInventarioView.as_view(), name='ajuste_inventario'),
    # CRUD y consultas
    path('', include(router.urls)),
]


