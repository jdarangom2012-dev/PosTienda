# ============================================================
# 6. ia/urls.py  (reemplaza el archivo vacío)
# ============================================================
from django.urls import path
from .views import ChatbotView

urlpatterns = [
    path('chat/', ChatbotView.as_view(), name='chat'),
]