@"
#!/usr/bin/env bash
cd server
daphne -b 0.0.0.0 -p `$PORT fne_backend.asgi:application
"@ | Out-File -Encoding utf8 start.sh