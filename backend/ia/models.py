# ============================================================
# APP: ia  →  ia/models.py
# ============================================================
from django.db import models
from productos.models import Producto


class PrediccionStock(models.Model):
    """
    Predicciones generadas por Prophet sobre el agotamiento
    futuro de productos. Se regeneran periódicamente.
    """
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='predicciones',
        verbose_name='Producto analizado'
    )
    fecha_prediccion = models.DateField(
        verbose_name='Fecha estimada de agotamiento'
    )
    dias_para_agotarse = models.IntegerField(
        verbose_name='Días restantes antes del agotamiento'
    )
    cantidad_sugerida = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Cantidad sugerida a comprar'
    )
    nivel_confianza = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Nivel de confianza de la predicción (0-100%)'
    )
    fecha_generada = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha en que se generó la predicción'
    )

    class Meta:
        verbose_name = 'Predicción de Stock'
        verbose_name_plural = 'Predicciones de Stock'
        db_table = 'predicciones_stock'
        ordering = ['dias_para_agotarse']

    def __str__(self):
        return (
            f"{self.producto.nombre} — "
            f"Se agota en {self.dias_para_agotarse} días "
            f"(confianza: {self.nivel_confianza}%)"
        )

    @property
    def es_critico(self):
        """True si el producto se agota en menos de 3 días."""
        return self.dias_para_agotarse <= 3

    @property
    def es_urgente(self):
        """True si el producto se agota en menos de 7 días."""
        return self.dias_para_agotarse <= 7