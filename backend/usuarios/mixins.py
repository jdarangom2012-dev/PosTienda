from rest_framework.permissions import IsAuthenticated


class TiendaMixin:
    """
    Mixin que filtra automáticamente los querysets por tienda.
    Agrégalo a cualquier ViewSet para aislar los datos por tienda.
    """
    permission_classes = [IsAuthenticated]

    def get_tienda(self):
        return getattr(self.request, 'tienda', None)

    def get_queryset(self):
        qs     = super().get_queryset()
        tienda = self.get_tienda()
        if tienda:
            return qs.filter(tienda=tienda)
        # Superadmin ve todo
        if getattr(self.request.user, 'es_superadmin', False):
            return qs
        return qs.none()

    def perform_create(self, serializer):
        tienda = self.get_tienda()
        serializer.save(tienda=tienda)