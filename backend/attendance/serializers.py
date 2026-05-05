"""
Serializers for attendance and class sessions.
"""
from rest_framework import serializers
from .models import ClassSession, Attendance, CourseTimetable
from accounts.serializers import StudentProfileSerializer


class ClassSessionSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSession
        fields = [
            'id', 'course', 'course_code', 'course_title',
            'date', 'start_time', 'end_time',
            'attendance_window_minutes', 'cancelled',
            'attendance_count', 'created_at'
        ]

    def get_attendance_count(self, obj):
        return obj.attendance_records.filter(status='present').count()


class ClassSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSession
        fields = ['course', 'date', 'start_time', 'end_time', 'attendance_window_minutes']


class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)
    session_date = serializers.DateField(source='class_session.date', read_only=True)
    course_code = serializers.CharField(source='class_session.course.code', read_only=True)
    course_title = serializers.CharField(source='class_session.course.title', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'class_session', 'timestamp',
            'status', 'session_date', 'course_code', 'course_title'
        ]


class MarkAttendanceSerializer(serializers.Serializer):
    """Student attendance marking via fingerprint ID + OTP."""
    fingerprint_id = serializers.IntegerField()
    otp = serializers.CharField(max_length=6)
    session_id = serializers.IntegerField(required=False, help_text='Optional: specific session to mark')


class AttendanceOverrideSerializer(serializers.Serializer):
    """Lecturer: override attendance status."""
    status = serializers.ChoiceField(choices=['present', 'absent', 'excused'])


class CourseTimetableSerializer(serializers.ModelSerializer):
    """Read serializer for timetable slots."""
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseTimetable
        fields = [
            'id', 'course', 'course_code', 'course_title',
            'day_of_week', 'day_name', 'start_time', 'end_time',
            'attendance_window_minutes', 'semester_start',
            'num_weeks', 'created_at',
        ]

    def get_day_name(self, obj):
        return dict(CourseTimetable.DAY_CHOICES).get(obj.day_of_week, '?')


class CourseTimetableCreateSerializer(serializers.ModelSerializer):
    """Write serializer for creating timetable slots."""
    class Meta:
        model = CourseTimetable
        fields = [
            'course', 'day_of_week', 'start_time', 'end_time',
            'attendance_window_minutes', 'semester_start', 'num_weeks',
        ]
