from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.http import JsonResponse
import os

def serve_frontend(request):
    index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            from django.http import HttpResponse
            return HttpResponse(f.read(), content_type='text/html')
    return JsonResponse({'error': 'Frontend not built yet'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('community.urls')),
    path('', serve_frontend, name='home'),
]
