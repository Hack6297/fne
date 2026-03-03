@"
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from .models import Project
import json

def index(request):
    return render(request, 'index.html')

@csrf_exempt
def project_list(request):
    projects = Project.objects.all()[:50]
    data = [{'id': p.id, 'title': p.title, 'author': p.author, 'description': p.description, 'likes': p.likes, 'plays': p.plays, 'created_at': str(p.created_at), 'thumbnail': p.thumbnail} for p in projects]
    return JsonResponse({'projects': data})

@csrf_exempt
def project_create(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        p = Project.objects.create(title=body.get('title', 'Untitled'), author=body.get('author', 'Anonymous'), description=body.get('description', ''), level_data=body.get('level_data', {}), thumbnail=body.get('thumbnail', ''))
        return JsonResponse({'id': p.id, 'title': p.title, 'status': 'ok'})
    return JsonResponse({'error': 'POST only'}, status=405)

@csrf_exempt
def project_detail(request, pk):
    try:
        p = Project.objects.get(pk=pk)
        return JsonResponse({'id': p.id, 'title': p.title, 'author': p.author, 'description': p.description, 'level_data': p.level_data, 'likes': p.likes, 'plays': p.plays, 'thumbnail': p.thumbnail})
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
"@ | Out-File -Encoding utf8 server/community/views.py