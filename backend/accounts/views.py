"""
Views for authentication, registration, and user management.
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.utils.crypto import get_random_string

from .serializers import (
    StudentSignupSerializer,
    LecturerSignupSerializer,
    LoginSerializer,
    UserProfileSerializer,
    StudentProfileSerializer,
    LecturerProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .models import StudentProfile, LecturerProfile

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def student_signup(request):
    """Register a new student (no password - OTP only)."""
    serializer = StudentSignupSerializer(data=request.data)
    if serializer.is_valid():
        profile = serializer.save()
        return Response(
            {
                'message': 'Student registered successfully.',
                'student_id': profile.id,
                'matric_number': profile.matric_number,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def lecturer_signup(request):
    """Register a new lecturer with password."""
    serializer = LecturerSignupSerializer(data=request.data)
    if serializer.is_valid():
        profile = serializer.save()
        # Generate JWT tokens for immediate login
        user = profile.user
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': 'Lecturer registered successfully.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """JWT login for lecturers and admins."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(request, username=email, password=password)

        if user is None:
            # Try authenticating with email as username field
            try:
                user_obj = User.objects.get(email=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                pass

        if user is None:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.is_student:
            return Response(
                {'error': 'Students cannot log in with a password. Use the attendance portal with your fingerprint ID and OTP.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        # Log the action
        from system_logs.models import SystemLog
        SystemLog.objects.create(user=user, action=f'User logged in: {user.email}')

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserProfileSerializer(user).data,
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def student_login(request):
    """
    Login endpoint for students via fingerprint ID + hardware TOTP OTP.

    The Arduino device:
      1. Verifies the student's fingerprint.
      2. Computes a 6-digit TOTP using the shared secret stored in EEPROM.
      3. Displays the OTP on the LCD.
    The student then enters this OTP here together with their fingerprint ID.

    Test account (seed data, no hardware required):
      fingerprint_id = 999, otp = 482391
    """
    from attendance.totp_utils import verify_otp  # avoid circular import at module level

    fingerprint_id = request.data.get('fingerprint_id')
    otp = request.data.get('otp')

    if not fingerprint_id or not otp:
        return Response(
            {'error': 'Fingerprint ID and OTP are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        fingerprint_id = int(fingerprint_id)
    except (ValueError, TypeError):
        return Response(
            {'error': 'Fingerprint ID must be an integer.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify OTP (handles test stub and real TOTP via pyotp)
    is_valid, error_msg = verify_otp(fingerprint_id, str(otp))
    if not is_valid:
        return Response({'error': error_msg}, status=status.HTTP_401_UNAUTHORIZED)

    # OTP accepted — find and authenticate the student
    try:
        student_profile = StudentProfile.objects.get(fingerprint_id=fingerprint_id)
    except StudentProfile.DoesNotExist:
        return Response(
            {'error': 'Fingerprint ID not recognised.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    user = student_profile.user
    refresh = RefreshToken.for_user(user)

    from system_logs.models import SystemLog
    SystemLog.objects.create(
        user=user,
        action=f'Student logged in via OTP: fingerprint_id={fingerprint_id}',
    )

    return Response({
        'message': 'Login successful.',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserProfileSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current authenticated user profile."""
    return Response(UserProfileSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_lecturers(request):
    """Admin: list all lecturers."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    lecturers = LecturerProfile.objects.select_related('user').all()
    serializer = LecturerProfileSerializer(lecturers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_students(request):
    """Admin: list all students."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    students = StudentProfile.objects.select_related('user').all()
    serializer = StudentProfileSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_student(request, pk):
    """Admin: update a student's details."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        student = StudentProfile.objects.get(pk=pk)
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    allowed_fields = ['full_name', 'matric_number', 'level', 'department', 'fingerprint_id', 'totp_secret']
    for field in allowed_fields:
        if field in request.data:
            setattr(student, field, request.data[field])
    student.save()

    from system_logs.models import SystemLog
    SystemLog.objects.create(
        user=request.user,
        action=f'Admin updated student: {student.matric_number}'
    )

    return Response(StudentProfileSerializer(student).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_lecturer(request, pk):
    """Admin: update a lecturer's details."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        lecturer = LecturerProfile.objects.get(pk=pk)
    except LecturerProfile.DoesNotExist:
        return Response({'error': 'Lecturer not found.'}, status=status.HTTP_404_NOT_FOUND)

    allowed_fields = ['title', 'first_name', 'last_name', 'department', 'levels_taught', 'phone', 'office_number']
    for field in allowed_fields:
        if field in request.data:
            setattr(lecturer, field, request.data[field])
    lecturer.save()

    # Handle password reset
    if 'new_password' in request.data:
        lecturer.user.set_password(request.data['new_password'])
        lecturer.user.save()

    from system_logs.models import SystemLog
    SystemLog.objects.create(
        user=request.user,
        action=f'Admin updated lecturer: {lecturer.last_name}'
    )

    return Response(LecturerProfileSerializer(lecturer).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Initiate password reset for lecturers.
    For now, this is a mock implementation that always returns success.
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            # Generate a mock reset token
            token = get_random_string(64)
            # In production, send email with reset link
            # For now, just log it
            from system_logs.models import SystemLog
            SystemLog.objects.create(
                user=user,
                action=f'Password reset requested for: {email} (token: {token[:8]}...)'
            )
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password with token.
    Mock implementation - always accepts for now.
    """
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        # In production, validate the token and find the user
        # For now, just return success
        return Response({'message': 'Password has been reset successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
