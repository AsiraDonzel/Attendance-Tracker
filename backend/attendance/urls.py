"""
URL routes for attendance app.
"""
from django.urls import path
from . import views
from . import student_views

urlpatterns = [
    # Public / Auth endpoints
    path('mark/', views.mark_attendance, name='mark-attendance'),
    
    # Student portal endpoints
    path('student/dashboard/', student_views.student_dashboard, name='student-dashboard'),
    path('student/history/', student_views.student_history, name='student-portal-history'),
    path('student/courses/', student_views.student_courses, name='student-courses'),
    
    # Legacy history access (if used by hardware fallback)
    path('history/', views.student_history, name='student-history'),
    
    # Lecturer endpoints (JWT protected)
    path('sessions/', views.session_list, name='session-list'),
    path('sessions/<int:pk>/', views.session_detail, name='session-detail'),
    path('sessions/<int:pk>/attendance/', views.session_attendance, name='session-attendance'),
    path('<int:pk>/override/', views.override_attendance, name='override-attendance'),
    path('create-record/', views.create_attendance_record, name='create-record'),
    path('report/<int:course_id>/', views.course_report, name='course-report'),
    path('export/<int:course_id>/', views.export_report, name='export-report'),
    path('grades/<int:course_id>/', views.calculate_grades, name='calculate-grades'),
    # Timetable endpoints
    path('timetable/', views.timetable_list, name='timetable-list'),
    path('timetable/<int:pk>/', views.timetable_delete, name='timetable-delete'),
    path('generate-sessions/', views.generate_sessions, name='generate-sessions'),
]
