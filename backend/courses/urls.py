"""
URL routes for courses app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.course_list, name='course-list'),
    path('<int:pk>/', views.course_detail, name='course-detail'),
    path('<int:pk>/students/', views.course_students, name='course-students'),
    path('assign-lecturer/', views.assign_lecturer, name='assign-lecturer'),
    path('unassign-lecturer/<int:pk>/', views.unassign_lecturer, name='unassign-lecturer'),
    path('my-courses/', views.my_courses, name='my-courses'),
]
