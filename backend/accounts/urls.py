"""
URL routes for accounts app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    path('signup/student/', views.student_signup, name='student-signup'),
    path('signup/lecturer/', views.lecturer_signup, name='lecturer-signup'),
    path('login/', views.login_view, name='login'),
    path('login/student/', views.student_login, name='student-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
    # Profile
    path('me/', views.me, name='me'),
    # Admin management
    path('lecturers/', views.list_lecturers, name='list-lecturers'),
    path('students/', views.list_students, name='list-students'),
    path('students/<int:pk>/', views.update_student, name='update-student'),
    path('lecturers/<int:pk>/', views.update_lecturer, name='update-lecturer'),
]
