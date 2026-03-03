from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'author', 'likes', 'plays', 'created_at')
    search_fields = ('name', 'author')
    list_filter = ('created_at',)
