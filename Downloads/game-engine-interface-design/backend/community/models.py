from django.db import models
import json

class Project(models.Model):
    name = models.CharField(max_length=200)
    author = models.CharField(max_length=100, default='Anonymous')
    description = models.TextField(blank=True, default='')
    level_data = models.JSONField(default=dict)
    thumbnail = models.TextField(blank=True, default='')
    likes = models.IntegerField(default=0)
    plays = models.IntegerField(default=0)
    downloads = models.IntegerField(default=0)
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} by {self.author}"

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'author': self.author,
            'description': self.description,
            'objects': self.level_data.get('objects', []),
            'scripts': self.level_data.get('scripts', []),
            'thumbnail': self.thumbnail,
            'likes': self.likes,
            'plays': self.plays,
            'downloads': self.downloads,
            'tags': self.tags,
            'createdAt': self.created_at.isoformat() if self.created_at else '',
        }
