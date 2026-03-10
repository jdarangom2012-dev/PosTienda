# ============================================================
# CONFIGURACIÓN DEL ADMIN DE DJANGO — SISTEMA POS
# ============================================================
# Archivo de referencia con el admin.py de cada app
# ============================================================


# ============================================================
# APP: usuarios  →  usuarios/admin.py
# ============================================================
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Columnas visibles en el listado
    list_display = (
        'username', 'nombre_completo', 'email',
        'rol', 'is_active', 'last_login'
    )
    # Filtros del panel derecho
    list_filter = ('rol', 'is_active', 'is_staff')
    # Campos por los que se puede buscar
    search_fields = ('username', 'nombre_completo', 'email')
    # Orden por defecto
    ordering = ('username',)
    # Campos que se pueden editar directamente en el listado
    list_editable = ('rol', 'is_active')

    # Secciones del formulario de edición
    fieldsets = UserAdmin.fieldsets + (
        ('Información del Sistema POS', {
            'fields': ('rol', 'nombre_completo'),
            'classes': ('wide',),
        }),
    )

    # Secciones del formulario de creación
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información del Sistema POS', {
            'fields': ('rol', 'nombre_completo', 'email'),
            'classes': ('wide',),
        }),
    )