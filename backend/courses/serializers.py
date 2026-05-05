"""
Serializers for courses, enrollments, and assignments.
"""
from rest_framework import serializers
from .models import Course, StudentEnrollment, LecturerAssignment
from accounts.serializers import StudentProfileSerializer, LecturerProfileSerializer


class CourseSerializer(serializers.ModelSerializer):
    lecturer_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'title', 'level', 'department',
            'credits', 'description', 'lecturer_count', 'student_count'
        ]

    def get_lecturer_count(self, obj):
        return obj.lecturer_assignments.count()

    def get_student_count(self, obj):
        return obj.student_enrollments.count()


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['code', 'title', 'level', 'department', 'credits', 'description']


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = ['id', 'student', 'course', 'enrolled_at']


class LecturerAssignmentSerializer(serializers.ModelSerializer):
    lecturer = LecturerProfileSerializer(read_only=True)

    class Meta:
        model = LecturerAssignment
        fields = ['id', 'lecturer', 'course', 'assigned_at']


class AssignLecturerSerializer(serializers.Serializer):
    lecturer_id = serializers.IntegerField()
    course_id = serializers.IntegerField()
