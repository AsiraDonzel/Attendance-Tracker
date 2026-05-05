"""
Serializers for authentication and user management.
"""
import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, LecturerProfile

User = get_user_model()


class StudentSignupSerializer(serializers.Serializer):
    """Multi-step student registration."""
    # Step 1 - Basic Info
    full_name = serializers.CharField(max_length=200)
    matric_number = serializers.CharField(max_length=20)
    level = serializers.ChoiceField(choices=StudentProfile.LEVEL_CHOICES)
    department = serializers.ChoiceField(choices=StudentProfile.DEPARTMENT_CHOICES)
    # Step 2 - Contact
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, default='')
    # Step 3 - Fingerprint
    fingerprint_id = serializers.IntegerField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_matric_number(self, value):
        if StudentProfile.objects.filter(matric_number=value).exists():
            raise serializers.ValidationError('This matric number is already registered.')
        return value

    def validate_fingerprint_id(self, value):
        if StudentProfile.objects.filter(fingerprint_id=value).exists():
            raise serializers.ValidationError('This fingerprint ID is already registered.')
        return value

    def create(self, validated_data):
        # Create user (no password for students)
        user = User.objects.create_user(
            username=validated_data['matric_number'],
            email=validated_data['email'],
            is_student=True,
        )
        user.set_unusable_password()
        user.save()

        # Create student profile
        profile = StudentProfile.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            matric_number=validated_data['matric_number'],
            level=validated_data['level'],
            department=validated_data['department'],
            fingerprint_id=validated_data['fingerprint_id'],
            totp_secret='',  # Will be set when hardware is ready
        )
        return profile


class LecturerSignupSerializer(serializers.Serializer):
    """Multi-step lecturer registration."""
    # Step 1 - Personal Info
    title = serializers.ChoiceField(choices=LecturerProfile.TITLE_CHOICES)
    last_name = serializers.CharField(max_length=100)
    first_name = serializers.CharField(max_length=100)
    department = serializers.ChoiceField(choices=LecturerProfile.DEPARTMENT_CHOICES)
    levels_taught = serializers.ListField(child=serializers.CharField(), min_length=1)
    num_courses = serializers.IntegerField(min_value=1, max_value=20)
    # Step 2 - Contact & Password
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, default='')
    office_number = serializers.CharField(max_length=20, required=False, default='')
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    # Step 3 - Selected courses (list of course IDs)
    selected_courses = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('Password must contain at least one digit.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError('Password must contain at least one special character.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        selected_courses = validated_data.pop('selected_courses', [])
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=password,
            is_lecturer=True,
        )

        profile = LecturerProfile.objects.create(
            user=user,
            title=validated_data['title'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            department=validated_data['department'],
            levels_taught=validated_data['levels_taught'],
            phone=validated_data.get('phone', ''),
            office_number=validated_data.get('office_number', ''),
            num_courses=validated_data['num_courses'],
        )

        # Assign selected courses
        if selected_courses:
            from courses.models import LecturerAssignment, Course
            for course_id in selected_courses:
                try:
                    course = Course.objects.get(id=course_id)
                    LecturerAssignment.objects.get_or_create(
                        lecturer=profile, course=course
                    )
                except Course.DoesNotExist:
                    pass

        return profile


class LoginSerializer(serializers.Serializer):
    """Email + password login for lecturers and admin."""
    email = serializers.EmailField()
    password = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    """Current user profile data."""
    student_profile = serializers.SerializerMethodField()
    lecturer_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'is_lecturer', 'is_admin', 'is_student',
            'student_profile', 'lecturer_profile'
        ]

    def get_student_profile(self, obj):
        if hasattr(obj, 'student_profile'):
            p = obj.student_profile
            return {
                'id': p.id,
                'full_name': p.full_name,
                'matric_number': p.matric_number,
                'level': p.level,
                'department': p.department,
                'fingerprint_id': p.fingerprint_id,
            }
        return None

    def get_lecturer_profile(self, obj):
        if hasattr(obj, 'lecturer_profile'):
            p = obj.lecturer_profile
            return {
                'id': p.id,
                'title': p.title,
                'first_name': p.first_name,
                'last_name': p.last_name,
                'department': p.department,
                'levels_taught': p.levels_taught,
                'phone': p.phone,
                'office_number': p.office_number,
                'num_courses': p.num_courses,
            }
        return None


class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'full_name', 'matric_number', 'level', 'department',
            'fingerprint_id', 'email'
        ]


class LecturerProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = LecturerProfile
        fields = [
            'id', 'title', 'first_name', 'last_name', 'department',
            'levels_taught', 'phone', 'office_number', 'num_courses', 'email'
        ]


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
