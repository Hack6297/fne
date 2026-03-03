import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Project

class CommunityConsumer(AsyncWebsocketConsumer):
    connected_users = set()

    async def connect(self):
        self.room_group = 'community'
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()
        CommunityConsumer.connected_users.add(self.channel_name)
        await self.channel_layer.group_send(self.room_group, {
            'type': 'online_count',
            'count': len(CommunityConsumer.connected_users),
        })

    async def disconnect(self, close_code):
        CommunityConsumer.connected_users.discard(self.channel_name)
        await self.channel_layer.group_discard(self.room_group, self.channel_name)
        await self.channel_layer.group_send(self.room_group, {
            'type': 'online_count',
            'count': len(CommunityConsumer.connected_users),
        })

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type', '')

            if msg_type == 'get_projects':
                tab = data.get('tab', 'featured')
                projects = await self.get_projects(tab)
                await self.send(text_data=json.dumps({
                    'type': 'projects_list',
                    'projects': projects,
                }))

            elif msg_type == 'publish_project':
                project_data = data.get('project', {})
                project = await self.create_project(project_data)
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'project_added',
                    'project': project,
                })

            elif msg_type == 'like_project':
                project_id = data.get('id')
                likes = await self.like_project(project_id)
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'project_liked',
                    'id': project_id,
                    'likes': likes,
                })

        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e),
            }))

    async def online_count(self, event):
        await self.send(text_data=json.dumps({
            'type': 'online_count',
            'count': event['count'],
        }))

    async def project_added(self, event):
        await self.send(text_data=json.dumps({
            'type': 'project_added',
            'project': event['project'],
        }))

    async def project_liked(self, event):
        await self.send(text_data=json.dumps({
            'type': 'project_liked',
            'id': event['id'],
            'likes': event['likes'],
        }))

    @database_sync_to_async
    def get_projects(self, tab):
        if tab == 'featured':
            projects = Project.objects.order_by('-likes', '-plays')[:50]
        elif tab == 'recent':
            projects = Project.objects.order_by('-created_at')[:50]
        elif tab == 'top':
            projects = Project.objects.order_by('-likes')[:50]
        else:
            projects = Project.objects.all()[:50]
        return [p.to_dict() for p in projects]

    @database_sync_to_async
    def create_project(self, data):
        project = Project.objects.create(
            name=data.get('name', data.get('levelName', 'Untitled')),
            author=data.get('author', 'Anonymous'),
            description=data.get('description', ''),
            level_data={
                'objects': data.get('objects', []),
                'scripts': data.get('scripts', []),
                'sceneBg': data.get('sceneBg', ''),
                'workspaceData': data.get('workspaceData', {}),
            },
            thumbnail=data.get('thumbnail', ''),
            tags=data.get('tags', []),
        )
        return project.to_dict()

    @database_sync_to_async
    def like_project(self, project_id):
        try:
            project = Project.objects.get(pk=int(project_id))
            project.likes += 1
            project.save()
            return project.likes
        except Project.DoesNotExist:
            return 0
