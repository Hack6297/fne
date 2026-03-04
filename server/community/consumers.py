import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Project

class CommunityConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room = 'community'
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        projects = await self.get_projects()
        await self.send(json.dumps({'type': 'projects_list', 'projects': projects}))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'publish':
            project = await self.create_project(data)
            await self.channel_layer.group_send(self.room, {'type': 'project_added', 'project': project})
        elif data.get('type') == 'get_projects':
            projects = await self.get_projects()
            await self.send(json.dumps({'type': 'projects_list', 'projects': projects}))

    async def project_added(self, event):
        await self.send(json.dumps({'type': 'project_added', 'project': event['project']}))

    @database_sync_to_async
    def get_projects(self):
        projects = Project.objects.all()[:50]
        result = []
        for p in projects:
            result.append({
                'id': p.id,
                'title': p.title,
                'author': p.author,
                'description': p.description,
                'likes': p.likes,
                'plays': p.plays,
                'created_at': str(p.created_at),
                'thumbnail': p.thumbnail
            })
        return result

    @database_sync_to_async
    def create_project(self, data):
        p = Project.objects.create(
            title=data.get('title', 'Untitled'),
            author=data.get('author', 'Anonymous'),
            description=data.get('description', ''),
            level_data=data.get('level_data', {}),
            thumbnail=data.get('thumbnail', '')
        )
        return {
            'id': p.id,
            'title': p.title,
            'author': p.author,
            'description': p.description,
            'likes': p.likes,
            'plays': p.plays,
            'created_at': str(p.created_at),
            'thumbnail': p.thumbnail
        }
