from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from openai import OpenAI
from decouple import config
from django.conf import settings


class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna estado de IA para la tienda."""
        tienda = getattr(request, 'tienda', None)
        if not tienda:
            return Response({'error': 'Tienda no encontrada.'}, status=400)

        tienda.reset_tokens_si_necesario()

        return Response({
            'plan'              : tienda.plan,
            'es_premium'        : tienda.es_premium,
            'tokens_disponibles': tienda.tokens_disponibles,
            'ia_tokens_mes'     : tienda.ia_tokens_mes,
            'ia_tokens_usados'  : tienda.ia_tokens_usados,
            'ia_reset_fecha'    : tienda.ia_reset_fecha,
        })

    def post(self, request):
        tienda = getattr(request, 'tienda', None)
        if not tienda:
            return Response({'error': 'Tienda no encontrada.'}, status=400)

        if not tienda.es_premium:
            return Response({
                'error': 'plan_basic',
                'mensaje': 'Tu plan actual no tiene habilitada la IA.'
            }, status=403)

        tienda.reset_tokens_si_necesario()
        if not tienda.tiene_tokens():
            return Response({
                'error': 'tokens_agotados',
                'mensaje': f'Tokens agotados. Reset el {tienda.ia_reset_fecha}.',
                'reset_fecha': tienda.ia_reset_fecha,
            }, status=429)

        mensaje = request.data.get('mensaje', '').strip()
        if not mensaje:
            return Response({'error': 'Mensaje vacío.'}, status=400)

        try:
            from django.conf import settings
            print(f"DEBUG API KEY: '{settings.OPENAI_API_KEY}'")  # ← AGREGAR
            client   = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model    = 'gpt-3.5-turbo',
                messages = [
                    {'role': 'system', 'content': 'Eres un asistente para una tienda.'},
                    {'role': 'user',   'content': mensaje}
                ],
                max_tokens = 500,
            )
            tienda.consumir_token()
            return Response({
                'respuesta'         : response.choices[0].message.content,
                'tokens_disponibles': tienda.tokens_disponibles,
                'tokens_usados'     : tienda.ia_tokens_usados,
            })
        except Exception as e:
            print(f"DEBUG ERROR: {e}")  # ← AGREGAR
            return Response({'error': str(e)}, status=500)