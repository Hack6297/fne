#!/usr/bin/env bash
cd server
daphne -b 0.0.0.0 -p $PORT fne_backend.asgi:application