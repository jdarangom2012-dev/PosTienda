# ============================================================
# APP: productos  →  productos/models.py
# ============================================================
from django.db import models
from usuarios.models import Tienda

class Categoria(models.Model):
    """
    Agrupa productos en categorías (Bebidas, Lácteos, Aseo, etc.)
    """
    tienda      = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                    related_name='categorias', null=True)
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre de la categoría'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Categoría activa'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        db_table = 'categorias'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    tienda         = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                       related_name='productos', null=True)
    """
    Maestro principal de productos.
    Contiene toda la información del catálogo comercial.
    """
    UNIDAD_CHOICES = [
        ('PIEZA',    'Pieza'),
        ('LITRO',    'Litro'),
        ('KG',       'Kilogramo'),
        ('GRAMO',    'Gramo'),
        ('CAJA',     'Caja'),
        ('PAQUETE',  'Paquete'),
        ('BOTELLA',  'Botella'),
        ('BOLSA',    'Bolsa'),
        ('UNIDAD',   'Unidad'),
    ]

    codigo_barras = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name='Código de barras'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del producto'
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción'
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Categoría'
    )
    precio_costo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio de costo'
    )
    precio_venta = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio de venta'
    )
    unidad_medida = models.CharField(
        max_length=20,
        choices=UNIDAD_CHOICES,
        default='PIEZA',
        verbose_name='Unidad de medida'
    )
    imagen_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL de imagen (Azure Blob)'
    )
    stock_minimo = models.IntegerField(
        default=0,
        verbose_name='Stock mínimo para alerta'
    )
    activo = models.BooleanField(
        default=True,
        verbose_name='Producto activo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última modificación'
    )

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        db_table = 'productos'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} (${self.precio_venta})"

    @property
    def margen_ganancia(self):
        """Calcula el margen de ganancia en porcentaje."""
        if self.precio_costo and self.precio_costo > 0:
            return round(
                ((self.precio_venta - self.precio_costo) / self.precio_costo) * 100, 2
            )
        return 0

    @property
    def stock_actual(self):
        """Retorna el stock actual desde la tabla inventario."""
        try:
            return self.inventario.cantidad_actual
        except Exception:
            return 0


