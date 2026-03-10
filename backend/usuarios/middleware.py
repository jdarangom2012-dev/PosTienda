from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError


class TiendaMiddleware(MiddlewareMixin):
    """
    Lee el token JWT y agrega la tienda al request.
    Así todos los views pueden usar request.tienda
    """
    def process_request(self, request):
        request.tienda = None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return

        token_str = auth_header.split(' ')[1]
        try:
            token         = AccessToken(token_str)
            tienda_id     = token.get('tienda_id')
            rol           = token.get('rol')

            if tienda_id:
                from .models import Tienda
                request.tienda    = Tienda.objects.get(id=tienda_id)
                request.tienda_id = tienda_id
            
            request.rol = rol
        except (TokenError, Exception):
            pass