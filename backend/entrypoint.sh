#!/bin/bash
echo "Esperando a PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "PostgreSQL listo!"

python manage.py migrate --noinput

# Reset contraseñas automático
python manage.py shell -c "
from usuarios.models import Usuario
for username, pwd in {'postienda':'1234567','jmoncada':'1234567','afelipe':'1234567','auxiliar1':'1234567','superadmin':'Admin123*'}.items():
    try:
        u = Usuario.objects.get(username=username)
        u.set_password(pwd)
        u.save()
    except: pass
print('Contraseñas OK')
"

python manage.py runserver 0.0.0.0:8000