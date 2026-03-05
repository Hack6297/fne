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
        if data.
