"""
Custom User model and profile models for students and lecturers.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Extended User model with role flags.
    Students have no password (OTP-only auth via hardware).
    Lecturers and admins use email + password + JWT.
    """
    email = models.EmailField(unique=True)
    is_lecturer = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_student = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email


class StudentProfile(models.Model):
    """
    Profile for student users.
    Linked to User via one-to-one relationship.
    """
    LEVEL_CHOICES = [
        ('100L', '100 Level'),
        ('200L', '200 Level'),
        ('300L', '300 Level'),
        ('400L', '400 Level'),
        ('500L', '500 Level'),
    ]

    DEPARTMENT_CHOICES = [
        ('Aeronautical', 'Aeronautical Engineering'),
        ('Chemical', 'Chemical Engineering'),
        ('Civil', 'Civil Engineering'),
        ('Biomedical', 'Biomedical Engineering'),
        ('Computer', 'Computer Engineering'),
        ('Electrical', 'Electrical Engineering'),
        ('Petroleum', 'Petroleum Engineering'),
        ('Mechanical', 'Mechanical Engineering'),
        ('Mechatronics', 'Mechatronics Engineering'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='student_profile'
    )
    full_name = models.CharField(max_length=200)
    matric_number = models.CharField(max_length=20, unique=True)
    level = models.CharField(max_length=4, choices=LEVEL_CHOICES)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    fingerprint_id = models.IntegerField(unique=True)
    totp_secret = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text='Base32-encoded TOTP shared secret for hardware OTP'
    )

    class Meta:
        db_table = 'student_profiles'

    def __str__(self):
        return f"{self.full_name} ({self.matric_number})"


class LecturerProfile(models.Model):
    """
    Profile for lecturer users.
    """
    TITLE_CHOICES = [
        ('Engr', 'Engr'),
        ('Dr', 'Dr'),
        ('Prof', 'Prof'),
    ]

    DEPARTMENT_CHOICES = StudentProfile.DEPARTMENT_CHOICES

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='lecturer_profile'
    )
    title = models.CharField(max_length=10, choices=TITLE_CHOICES)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    levels_taught = models.JSONField(
        default=list,
        help_text='List of levels, e.g. ["100L", "200L"]'
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    office_number = models.CharField(max_length=20, blank=True, default='')
    num_courses = models.IntegerField(default=1)

    class Meta:
        db_table = 'lecturer_profiles'

    def __str__(self):
        return f"{self.title} {self.last_name}, {self.first_name}"
