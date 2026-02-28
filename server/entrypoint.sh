#!/usr/bin/env bash
set -e


echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating/updating superuser..."
python create_superuser.py || true

echo "Starting command: $@"
exec "$@"
