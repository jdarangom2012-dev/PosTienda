# ============================================================
# APP: creditos → creditos/models.py
# ============================================================
from django.db import models
from usuarios.models import Tienda, Usuario
from ventas.models import Venta


class Credito(models.Model):

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO',    'Pagado'),
        ('VENCIDO',   'Vencido'),
    ]

    tienda             = models.ForeignKey(Tienda, on_delete=models.CASCADE,
                                           related_name='creditos')
    venta              = models.OneToOneField(Venta, on_delete=models.PROTECT,
                                              related_name='credito', null=True, blank=True)
    cliente_nombre     = models.CharField(max_length=200, verbose_name='Nombre del cliente')
    cliente_telefono   = models.CharField(max_length=20, blank=True, null=True,
                                          verbose_name='Teléfono del cliente')
    total_deuda        = models.DecimalField(max_digits=12, decimal_places=2,
                                             verbose_name='Total de la deuda')
    total_abonado      = models.DecimalField(max_digits=12, decimal_places=2,
                                             default=0, verbose_name='Total abonado')
    estado             = models.CharField(max_length=20, choices=ESTADO_CHOICES,
                                          default='PENDIENTE', verbose_name='Estado')
    usuario            = models.ForeignKey(Usuario, on_delete=models.PROTECT,
                                           related_name='creditos_creados',
                                           verbose_name='Usuario que registró')
    notas              = models.TextField(blank=True, null=True, verbose_name='Notas')
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Crédito'
        verbose_name_plural = 'Créditos'
        db_table            = 'creditos'
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.cliente_nombre} — ${self.total_deuda} ({self.estado})"

    @property
    def saldo_pendiente(self):
        return self.total_deuda - self.total_abonado

    @property
    def esta_pagado(self):
        return self.saldo_pendiente <= 0


class AbonoCredito(models.Model):

    FORMA_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('NEQUI',    'Nequi'),
        ('OTRO',     'Otro'),
    ]

    credito    = models.ForeignKey(Credito, on_delete=models.CASCADE,
                                   related_name='abonos')
    monto      = models.DecimalField(max_digits=12, decimal_places=2,
                                     verbose_name='Monto del abono')
    forma_pago = models.CharField(max_length=20, choices=FORMA_PAGO_CHOICES,
                                  default='EFECTIVO', verbose_name='Forma de pago')
    nota       = models.TextField(blank=True, null=True, verbose_name='Nota')
    usuario    = models.ForeignKey(Usuario, on_delete=models.PROTECT,
                                   related_name='abonos_registrados',
                                   verbose_name='Usuario que recibió el abono')
    created_at = models.DateTimeField(auto_now_add=True)