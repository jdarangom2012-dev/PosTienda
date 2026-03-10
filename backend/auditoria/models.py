# ============================================================
# APP: auditoria  →  auditoria/models.py
# ============================================================
from django.db import models


class Auditoria(models.Model):
    """
    Log inmutable de todas las acciones críticas del sistema.
    REGLA: Solo INSERT permitido. Nunca UPDATE ni DELETE.
    Se registra automáticamente desde los signals o middleware.
    """
    ACCION_CHOICES = [
        ('INSERT',   'Creación de registro'),
        ('UPDATE',   'Modificación de registro'),
        ('DELETE',   'Eliminación de registro'),
        ('LOGIN',    'Inicio de sesión'),
        ('LOGOUT',   'Cierre de sesión'),
        ('CANCEL',   'Cancelación de venta'),
        ('AJUSTE',   'Ajuste de inventario'),
        ('PRECIO',   'Cambio de precio'),
    ]

    fecha_hora = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha y hora del evento'
    )
    # Guardamos el ID y el nombre por separado.
    # Si el usuario se elimina, el nombre queda preservado en el log.
    usuario_id_ref = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID del usuario'
    )
    usuario_nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre del usuario (snapshot)'
    )
    accion = models.CharField(
        max_length=20,
        choices=ACCION_CHOICES,
        verbose_name='Acción realizada'
    )
    tabla_afectada = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tabla afectada'
    )
    registro_id = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID del registro afectado'
    )
    valor_anterior = models.JSONField(
        blank=True,
        null=True,
        verbose_name='Valor anterior (JSON)'
    )
    valor_nuevo = models.JSONField(
        blank=True,
        null=True,
        verbose_name='Valor nuevo (JSON)'
    )
    ip_dispositivo = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name='IP del dispositivo'
    )
    detalle = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción legible del evento'
    )

    class Meta:
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'
        db_table = 'auditoria'
        ordering = ['-fecha_hora']
        # Solo permite inserción — nunca actualizar ni borrar
        default_permissions = ('add', 'view')

    def __str__(self):
        return f"[{self.fecha_hora}] {self.accion} — {self.usuario_nombre} — {self.tabla_afectada}"

    def save(self, *args, **kwargs):
        """Bloquea cualquier intento de actualizar un registro existente."""
        if self.pk:
            raise PermissionError("Los registros de auditoría no pueden modificarse.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Bloquea cualquier intento de eliminar un registro."""
        raise PermissionError("Los registros de auditoría no pueden eliminarse.")


# ============================================================
# Función helper para registrar en auditoría fácilmente
# Úsala desde cualquier view o signal
# ============================================================
def registrar_auditoria(request, accion, tabla=None, registro_id=None,
                        valor_anterior=None, valor_nuevo=None, detalle=None):
    """
    Crea un registro de auditoría.
    Uso:
        registrar_auditoria(request, 'UPDATE', 'productos', producto.id,
                            valor_anterior={'precio': 1000},
                            valor_nuevo={'precio': 1200},
                            detalle='Cambio de precio de Coca Cola')
    """
    usuario = request.user if request and request.user.is_authenticated else None
    ip = None
    if request:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
        if not ip:
            ip = request.META.get('REMOTE_ADDR')

    Auditoria.objects.create(
        usuario_id_ref=usuario.id if usuario else None,
        usuario_nombre=usuario.get_full_name() or usuario.username if usuario else 'Sistema',
        accion=accion,
        tabla_afectada=tabla,
        registro_id=registro_id,
        valor_anterior=valor_anterior,
        valor_nuevo=valor_nuevo,
        ip_dispositivo=ip,
        detalle=detalle,
    )