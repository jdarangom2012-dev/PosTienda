from django.urls import path
from rest_framework.routers import SimpleRouter
from .views import (
    FormaPagoViewSet, VentaViewSet,
    ProcesarVentaView, CancelarVentaView,
    CierreCajaView, HistorialCajaView,
)

router = SimpleRouter()
router.register(r'formas-pago', FormaPagoViewSet, basename='forma-pago')
router.register(r'historial',   VentaViewSet,     basename='venta')

urlpatterns = [
    path('procesar/',                  ProcesarVentaView.as_view(),   name='procesar_venta'),
    path('<int:venta_id>/cancelar/',   CancelarVentaView.as_view(),   name='cancelar_venta'),
    path('caja/',                      CierreCajaView.as_view(),      name='caja'),
    path('caja/historial/',            HistorialCajaView.as_view(),   name='historial_caja'),
] + router.urls