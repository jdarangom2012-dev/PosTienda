# ============================================================
# APP: creditos → creditos/urls.py
# ============================================================
from django.urls        import path, include
from rest_framework.routers import DefaultRouter
from .views import CreditoViewSet

router = DefaultRouter()
router.register(r'', CreditoViewSet, basename='creditos')

urlpatterns = [
    path('', include(router.urls)),
]