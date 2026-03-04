#!/usr/bin/env bash
set -o errexit
npm install
npm run build
pip install -r requirements.txt
cd server
python manage.py migrate
python manage.py collectstatic --no-input