"""
Models for courses, enrollments, and lecturer assignments.
"""
from django.db import models
from accounts.models import StudentProfile, LecturerProfile


class Course(models.Model):
    """A course offered in the system."""
    LEVEL_CHOICES = StudentProfile.LEVEL_CHOICES
    DEPARTMENT_CHOICES = StudentProfile.DEPARTMENT_CHOICES

    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    level = models.CharField(max_length=4, choices=LEVEL_CHOICES)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    credits = models.IntegerField(default=3)
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'courses'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.title}"


class StudentEnrollment(models.Model):
    """Many-to-many: students enrolled in courses."""
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name='enrollments'
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='student_enrollments'
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_enrollments'
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.matric_number} -> {self.course.code}"


class LecturerAssignment(models.Model):
    """Many-to-many: lecturers assigned to courses."""
    lecturer = models.ForeignKey(
        LecturerProfile, on_delete=models.CASCADE, related_name='assignments'
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='lecturer_assignments'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lecturer_assignments'
        unique_together = ('lecturer', 'course')

    def __str__(self):
        return f"{self.lecturer.last_name} -> {self.course.code}"
