"""
Views for course management, enrollments, and assignments.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Course, StudentEnrollment, LecturerAssignment
from .serializers import (
    CourseSerializer,
    CourseCreateSerializer,
    StudentEnrollmentSerializer,
    AssignLecturerSerializer,
)
from accounts.models import StudentProfile, LecturerProfile
from accounts.serializers import StudentProfileSerializer


@api_view(['GET', 'POST'])
def course_list(request):
    """
    GET: List courses (filterable by department, level). Public for signup flow.
    POST: Admin-only create course.
    """
    if request.method == 'GET':
        courses = Course.objects.all()
        department = request.query_params.get('department')
        level = request.query_params.get('level')
        if department:
            courses = courses.filter(department=department)
        if level:
            courses = courses.filter(level=level)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    # POST - create course (admin only)
    if not request.user.is_authenticated or not request.user.is_admin:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = CourseCreateSerializer(data=request.data)
    if serializer.is_valid():
        course = serializer.save()

        # Auto-enroll students matching department + level
        matching_students = StudentProfile.objects.filter(
            department=course.department,
            level=course.level,
        )
        for student in matching_students:
            StudentEnrollment.objects.get_or_create(student=student, course=course)

        from system_logs.models import SystemLog
        SystemLog.objects.create(
            user=request.user,
            action=f'Course created: {course.code} - {course.title}'
        )

        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def course_detail(request, pk):
    """Admin: get, update, or delete a course."""
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CourseSerializer(course).data)

    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PATCH':
        serializer = CourseCreateSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(CourseSerializer(course).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        code = course.code
        course.delete()

        from system_logs.models import SystemLog
        SystemLog.objects.create(
            user=request.user,
            action=f'Course deleted: {code}'
        )

        return Response({'message': 'Course deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_students(request, pk):
    """Get students enrolled in a course."""
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    enrollments = StudentEnrollment.objects.filter(course=course).select_related('student')
    students = [e.student for e in enrollments]
    serializer = StudentProfileSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_lecturer(request):
    """Admin: assign a lecturer to a course."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AssignLecturerSerializer(data=request.data)
    if serializer.is_valid():
        try:
            lecturer = LecturerProfile.objects.get(id=serializer.validated_data['lecturer_id'])
            course = Course.objects.get(id=serializer.validated_data['course_id'])
        except (LecturerProfile.DoesNotExist, Course.DoesNotExist):
            return Response({'error': 'Lecturer or course not found.'}, status=status.HTTP_404_NOT_FOUND)

        assignment, created = LecturerAssignment.objects.get_or_create(
            lecturer=lecturer, course=course
        )

        from system_logs.models import SystemLog
        SystemLog.objects.create(
            user=request.user,
            action=f'Lecturer {lecturer.last_name} assigned to {course.code}'
        )

        return Response({
            'message': 'Lecturer assigned successfully.' if created else 'Assignment already exists.',
            'assignment_id': assignment.id,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unassign_lecturer(request, pk):
    """Admin: remove a lecturer assignment."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        assignment = LecturerAssignment.objects.get(pk=pk)
        assignment.delete()
        return Response({'message': 'Assignment removed.'}, status=status.HTTP_204_NO_CONTENT)
    except LecturerAssignment.DoesNotExist:
        return Response({'error': 'Assignment not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_courses(request):
    """Lecturer: get their assigned courses."""
    if not request.user.is_lecturer:
        return Response({'error': 'Lecturer access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        profile = request.user.lecturer_profile
    except LecturerProfile.DoesNotExist:
        return Response({'error': 'Lecturer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    assignments = LecturerAssignment.objects.filter(lecturer=profile).select_related('course')
    courses = [a.course for a in assignments]
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)
