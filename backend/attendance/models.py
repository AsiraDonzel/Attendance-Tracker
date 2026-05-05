"""
Models for class sessions and attendance records.
"""
from django.db import models
from accounts.models import StudentProfile
from courses.models import Course


class ClassSession(models.Model):
    """A scheduled class session for a course."""
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='sessions'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    attendance_window_minutes = models.IntegerField(
        default=30,
        help_text='Duration in minutes after start_time during which attendance can be marked'
    )
    cancelled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'class_sessions'
        ordering = ['-date', '-start_time']

    def __str__(self):
        status = ' [CANCELLED]' if self.cancelled else ''
        return f"{self.course.code} - {self.date} {self.start_time}{status}"


class Attendance(models.Model):
    """Attendance record for a student in a class session."""
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('excused', 'Excused'),
    ]

    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name='attendance_records'
    )
    class_session = models.ForeignKey(
        ClassSession, on_delete=models.CASCADE, related_name='attendance_records'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')

    class Meta:
        db_table = 'attendance_records'
        unique_together = ('student', 'class_session')

    def __str__(self):
        return f"{self.student.matric_number} - {self.class_session} - {self.status}"


class CourseTimetable(models.Model):
    """
    Recurring weekly schedule slot for a course.
    The admin sets day/time and semester dates; sessions are auto-generated.
    """
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
    ]

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='timetable_slots'
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    attendance_window_minutes = models.IntegerField(default=30)
    semester_start = models.DateField(
        help_text='First day of the semester (sessions generated from this date)'
    )
    num_weeks = models.IntegerField(
        default=13,
        help_text='Number of weeks to generate sessions for'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_timetable'
        unique_together = ('course', 'day_of_week', 'start_time')
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        day_name = dict(self.DAY_CHOICES).get(self.day_of_week, '?')
        return f"{self.course.code} - {day_name} {self.start_time}-{self.end_time}"
