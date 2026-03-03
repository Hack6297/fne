#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# Build frontend
cd ..
npm install
npm run build

# Copy frontend build to Django staticfiles
cd backend
mkdir -p staticfiles
cp ../dist/index.html staticfiles/index.html

# Django setup
python manage.py collectstatic --no-input
python manage.py migrate
