from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from dateutil.relativedelta import relativedelta


class Tienda(models.Model):
    PLAN_CHOICES = [('BASIC', 'Básico'), ('PREMIUM', 'Premium')]
    codigo             = models.CharField(max_length=20, unique=True, verbose_name='Código')
    nombre             = models.CharField(max_length=100)
    direccion          = models.CharField(max_length=200, blank=True)
    telefono           = models.CharField(max_length=20,  blank=True)
    email              = models.EmailField(blank=True)
    activa             = models.BooleanField(default=True)
    plan               = models.CharField(max_length=10, choices=PLAN_CHOICES, default='BASIC')

    # IA
    ia_activa          = models.BooleanField(default=False)
    ia_tokens_mes      = models.IntegerField(default=50)
    ia_tokens_usados   = models.IntegerField(default=0)
    ia_reset_fecha     = models.DateField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    @property
    def es_premium(self):
        return self.plan == 'PREMIUM' and self.ia_activa

    @property
    def tokens_disponibles(self):
        return max(0, self.ia_tokens_mes - self.ia_tokens_usados)

    def reset_tokens_si_necesario(self):
        hoy = timezone.now().date()
        if not self.ia_reset_fecha or hoy >= self.ia_reset_fecha:
            self.ia_tokens_usados = 0
            self.ia_reset_fecha   = hoy + relativedelta(months=1)
            self.save()

    def tiene_tokens(self):
        self.reset_tokens_si_necesario()
        return self.tokens_disponibles > 0

    def consumir_token(self):
        self.ia_tokens_usados += 1
        self.save()

    class Meta:
        verbose_name        = 'Tienda'
        verbose_name_plural = 'Tiendas'
        ordering            = ['nombre']

    def __str__(self):
        return f'{self.codigo} — {self.nombre}'

    def reset_tokens_si_necesario(self):
        from datetime import date
        from dateutil.relativedelta import relativedelta
        hoy = date.today()
        if self.ia_reset_fecha and hoy >= self.ia_reset_fecha:
            self.ia_tokens_usados = 0
            self.ia_reset_fecha   = hoy + relativedelta(months=1)
            self.save(update_fields=['ia_tokens_usados', 'ia_reset_fecha'])

    def tiene_tokens(self):
        self.reset_tokens_si_necesario()
        return self.ia_activa and self.ia_tokens_usados < self.ia_tokens_mes


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('SUPERADMIN',   'Super Administrador'),
        ('COORDINADOR',  'Coordinador'),
        ('CAJERO',       'Cajero'),
        ('ALMACENISTA',  'Almacenista'),
    ]
    tienda          = models.ForeignKey(
        Tienda, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='usuarios'
    )
    nombre_completo = models.CharField(max_length=100, blank=True)
    rol             = models.CharField(max_length=20, choices=ROL_CHOICES, default='CAJERO')

    class Meta:
        verbose_name        = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.username} ({self.get_rol_display()})'

    @property
    def es_superadmin(self):
        return self.rol == 'SUPERADMIN'