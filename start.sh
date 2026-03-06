cd server && DJANGO_SETTINGS_MODULE=fne_backend.settings /opt/render/project/src/.venv/bin/daphne -b 0.0.0.0 -p ${PORT:-10000} fne_backend.asgi:application
