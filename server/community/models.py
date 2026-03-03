@"
from django.db import models

class Project(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100, default='Anonymous')
    description = models.TextField(blank=True, default='')
    level_data = models.JSONField(default=dict)
    thumbnail = models.TextField(blank=True, default='')
    likes = models.IntegerField(default=0)
    plays = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
"@ | Out-File -Encoding utf8 server/community/models.py