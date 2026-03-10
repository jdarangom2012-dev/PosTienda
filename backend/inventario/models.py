# ============================================================
# APP: inventario  →  inventario/models.py
# ============================================================
from django.db import models
from productos.models import Producto
from usuarios.models import Tienda, Usuario

class Inventario(models.Model):
    tienda          = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                        related_name='inventarios', null=True)
    """
    Stock actual de cada producto.
    Se actualiza automáticamente con cada venta o entrada.
    Relación 1:1 con Producto.
    """
    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        related_name='inventario',
        verbose_name='Producto'
    )
    cantidad_actual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Cantidad actual en stock'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    class Meta:
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventario'
        db_table = 'inventario'

    def __str__(self):
        return f"{self.producto.nombre} — Stock: {self.cantidad_actual}"

    @property
    def esta_bajo_minimo(self):
        """True si el stock está por debajo del mínimo definido."""
        return self.cantidad_actual <= self.producto.stock_minimo

    def agregar_stock(self, cantidad):
        """Suma cantidad al stock actual."""
        self.cantidad_actual += cantidad
        self.save()

    def descontar_stock(self, cantidad):
        """Resta cantidad al stock actual."""
        self.cantidad_actual -= cantidad
        self.save()


class MovimientoInventario(models.Model):
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                        related_name='movimientos', null=True)
    """
    Historial completo de movimientos de stock.
    Registra entradas, salidas y ajustes con su justificación.
    """
    TIPO_CHOICES = [
        ('ENTRADA',     'Entrada de mercancía'),
        ('SALIDA',      'Salida por venta'),
        ('AJUSTE_POS',  'Ajuste positivo'),
        ('AJUSTE_NEG',  'Ajuste negativo'),
        ('DEVOLUCION',  'Devolución de cliente'),
    ]

    REFERENCIA_CHOICES = [
        ('VENTA',   'Venta'),
        ('COMPRA',  'Compra a proveedor'),
        ('AJUSTE',  'Ajuste manual'),
    ]

    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='movimientos',
        verbose_name='Producto'
    )
    tipo_movimiento = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        verbose_name='Tipo de movimiento'
    )
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Cantidad del movimiento'
    )
    stock_anterior = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Stock antes del movimiento'
    )
    stock_nuevo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Stock después del movimiento'
    )
    referencia_id = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID de referencia (venta/compra)'
    )
    referencia_tipo = models.CharField(
        max_length=20,
        choices=REFERENCIA_CHOICES,
        blank=True,
        null=True,
        verbose_name='Tipo de referencia'
    )
    motivo = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo del ajuste'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
        verbose_name='Usuario responsable'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y hora del movimiento'
    )

    class Meta:
        verbose_name = 'Movimiento de Inventario'
        verbose_name_plural = 'Movimientos de Inventario'
        db_table = 'movimientos_inventario'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tipo_movimiento} — {self.producto.nombre} ({self.cantidad})"
