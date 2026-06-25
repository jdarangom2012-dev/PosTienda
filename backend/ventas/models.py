# ============================================================
# APP: ventas  →  ventas/models.py
# ============================================================
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from productos.models import Producto
from usuarios.models import Tienda, Usuario


class FormaPago(models.Model):
    tienda  = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                related_name='formas_pago', null=True)
    """
    Catálogo de formas de pago aceptadas en caja.
    Ej: Efectivo, Nequi, Daviplata, Transferencia, Tarjeta.
    """
    nombre = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Forma de pago'
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Habilitada en caja'
    )

    class Meta:
        verbose_name = 'Forma de Pago'
        verbose_name_plural = 'Formas de Pago'
        db_table = 'formas_pago'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Venta(models.Model):
    """
    Encabezado de cada transacción de venta (ticket/factura).
    Una venta tiene múltiples líneas de detalle y uno o más pagos.
    """
    ESTADO_CHOICES = [
        ('COMPLETADA',  'Completada'),
        ('CANCELADA',   'Cancelada'),
        ('DEVUELTA',    'Devuelta'),
    ]
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                           related_name='ventas', null=True)

    fecha_hora = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y hora de la venta'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='ventas',
        verbose_name='Cajero'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Subtotal antes de descuentos'
    )
    descuento = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Descuento total'
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Total a cobrar'
    )
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='COMPLETADA',
        verbose_name='Estado de la venta'
    )
    motivo_cancelacion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo de cancelación'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de registro'
    )

    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        db_table = 'ventas'
        ordering = ['-fecha_hora']

    def __str__(self):
        return f"Venta #{self.id} — ${self.total} ({self.estado})"

    def calcular_totales(self):
        """Recalcula subtotal, descuento y total desde las líneas de detalle."""
        lineas = self.detalle.all()
        self.subtotal = sum(l.precio_unit * l.cantidad for l in lineas)
        self.descuento = sum(l.descuento for l in lineas)
        self.total = self.subtotal - self.descuento
        self.save()


class VentaDetalle(models.Model):
    """
    Líneas del ticket de venta.
    Cada registro es un producto vendido con su cantidad y precio.
    """
    venta = models.ForeignKey(
        Venta,
        on_delete=models.CASCADE,
        related_name='detalle',
        verbose_name='Venta'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='ventas_detalle',
        verbose_name='Producto'
    )
    cantidad = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Cantidad vendida'
    )
    precio_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio unitario al momento de la venta'
    )
    descuento = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Descuento en esta línea'
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Subtotal de la línea'
    )

    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'
        db_table = 'ventas_detalle'

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad} = ${self.subtotal}"

    def save(self, *args, **kwargs):
        """Calcula el subtotal automáticamente antes de guardar."""
        self.subtotal = (self.precio_unit * self.cantidad) - self.descuento
        super().save(*args, **kwargs)


class VentaPago(models.Model):
    """
    Pagos aplicados a cada venta.
    Permite pagos mixtos (efectivo + Nequi, por ejemplo).
    """
    venta = models.ForeignKey(
        Venta,
        on_delete=models.CASCADE,
        related_name='pagos',
        verbose_name='Venta'
    )
    forma_pago = models.ForeignKey(
        FormaPago,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Forma de pago'
    )
    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Monto pagado'
    )
    referencia = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Referencia (nro. transferencia / voucher)'
    )

    class Meta:
        verbose_name = 'Pago de Venta'
        verbose_name_plural = 'Pagos de Venta'
        db_table = 'ventas_pagos'

    def __str__(self):
        return f"{self.forma_pago.nombre} — ${self.monto}"

class CierreCaja(models.Model):
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('CERRADA', 'Cerrada'),
    ]

    tienda                  = models.ForeignKey('usuarios.Tienda', on_delete=models.CASCADE,
                                                related_name='cierres_caja')
    usuario                 = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT,
                                                related_name='cierres_caja')
    fecha                   = models.DateField(verbose_name='Fecha')
    hora_apertura           = models.DateTimeField(auto_now_add=True)
    hora_cierre             = models.DateTimeField(null=True, blank=True)
    monto_apertura          = models.DecimalField(max_digits=12, decimal_places=2,
                                                  verbose_name='Base inicial efectivo')
    total_ventas_efectivo   = models.DecimalField(max_digits=12, decimal_places=2,
                                                  default=0, verbose_name='Ventas en efectivo')
    total_ventas_nequi      = models.DecimalField(max_digits=12, decimal_places=2,
                                                  default=0, verbose_name='Ventas en Nequi')
    total_abonos_efectivo   = models.DecimalField(max_digits=12, decimal_places=2,
                                                  default=0, verbose_name='Abonos en efectivo')
    total_abonos_nequi      = models.DecimalField(max_digits=12, decimal_places=2,
                                                  default=0, verbose_name='Abonos en Nequi')
    monto_esperado          = models.DecimalField(max_digits=12, decimal_places=2,
                                                  default=0, verbose_name='Total esperado en caja')
    monto_real              = models.DecimalField(max_digits=12, decimal_places=2,
                                                  null=True, blank=True, verbose_name='Conteo real')
    diferencia              = models.DecimalField(max_digits=12, decimal_places=2,
                                                  null=True, blank=True, verbose_name='Diferencia')
    notas                   = models.TextField(blank=True, null=True)
    estado                  = models.CharField(max_length=10, choices=ESTADO_CHOICES,
                                               default='ABIERTA')
    created_at              = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Cierre de Caja'
        verbose_name_plural = 'Cierres de Caja'
        db_table            = 'cierres_caja'
        ordering            = ['-fecha', '-hora_apertura']

    def __str__(self):
        return f"Caja {self.fecha} — {self.usuario.username} ({self.estado})"

    @property
    def total_efectivo_esperado(self):
        return self.monto_apertura + self.total_ventas_efectivo + self.total_abonos_efectivo