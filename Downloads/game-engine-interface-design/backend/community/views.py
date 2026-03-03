from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Project
import json

@csrf_exempt
@require_http_methods(["GET", "POST"])
def project_list(request):
    if request.method == 'GET':
        tab = request.GET.get('tab', 'featured')
        search = request.GET.get('search', '')

        projects = Project.objects.all()

        if search:
            projects = projects.filter(name__icontains=search) | projects.filter(author__icontains=search)

        if tab == 'featured':
            projects = projects.order_by('-likes', '-plays')
        elif tab == 'recent':
            projects = projects.order_by('-created_at')
        elif tab == 'top':
            projects = projects.order_by('-likes')

        projects = projects[:50]
        return JsonResponse({
            'projects': [p.to_dict() for p in projects],
            'count': projects.count(),
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            project = Project.objects.create(
                name=data.get('name', 'Untitled'),
                author=data.get('author', 'Anonymous'),
                description=data.get('description', ''),
                level_data=data.get('levelData', {}),
                thumbnail=data.get('thumbnail', ''),
                tags=data.get('tags', []),
            )
            return JsonResponse({'status': 'ok', 'project': project.to_dict()}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def project_detail(request, pk):
    try:
        project = Project.objects.get(pk=pk)
        return JsonResponse({'project': project.to_dict()})
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

@csrf_exempt
@require_http_methods(["POST"])
def project_like(request, pk):
    try:
        project = Project.objects.get(pk=pk)
        project.likes += 1
        project.save()
        return JsonResponse({'likes': project.likes})
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

@csrf_exempt
@require_http_methods(["POST"])
def project_play(request, pk):
    try:
        project = Project.objects.get(pk=pk)
        project.plays += 1
        project.save()
        return JsonResponse({'plays': project.plays})
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
