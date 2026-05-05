from django.contrib import admin
from .models import User, StudentProfile, LecturerProfile

admin.site.register(User)
admin.site.register(StudentProfile)
admin.site.register(LecturerProfile)
