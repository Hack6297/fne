from django.contrib import admin
from django.urls import path
from community import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/projects/', views.project_list, name='project_list'),
    path('api/projects/create/', views.project_create, name='project_create'),
    path('api/projects/<int:pk>/', views.project_detail, name='project_detail'),
    path('', views.index, name='index'),
]
