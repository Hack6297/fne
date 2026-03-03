from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.project_list, name='project_list'),
    path('projects/<int:pk>/', views.project_detail, name='project_detail'),
    path('projects/<int:pk>/like/', views.project_like, name='project_like'),
    path('projects/<int:pk>/play/', views.project_play, name='project_play'),
]
