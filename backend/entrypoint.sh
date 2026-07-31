#!/bin/bash

echo "Esperando a PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "PostgreSQL listo!"

python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000