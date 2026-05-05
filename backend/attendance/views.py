"""
Views for attendance marking, class sessions, reports, and exports.
"""
import io
from datetime import datetime, date, timedelta

from django.utils import timezone
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import ClassSession, Attendance, CourseTimetable
from .serializers import (
    ClassSessionSerializer,
    ClassSessionCreateSerializer,
    AttendanceSerializer,
    MarkAttendanceSerializer,
    AttendanceOverrideSerializer,
    CourseTimetableSerializer,
    CourseTimetableCreateSerializer,
)
from .totp_utils import verify_otp
from accounts.models import StudentProfile
from courses.models import Course, StudentEnrollment, LecturerAssignment


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_attendance(request):
    """
    Student marks attendance using fingerprint ID + OTP.
    Public endpoint (no JWT required).
    """
    serializer = MarkAttendanceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    fingerprint_id = serializer.validated_data['fingerprint_id']
    otp_code = serializer.validated_data['otp']
    session_id = serializer.validated_data.get('session_id')

    # Look up student by fingerprint ID
    try:
        student = StudentProfile.objects.get(fingerprint_id=fingerprint_id)
    except StudentProfile.DoesNotExist:
        return Response(
            {'error': 'Invalid ID. No student found with this fingerprint ID.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Verify OTP
    # TODO: integrate real pyotp when hardware ready
    is_valid, error_msg = verify_otp(fingerprint_id, otp_code)
    if not is_valid:
        return Response({'error': error_msg}, status=status.HTTP_401_UNAUTHORIZED)

    now = timezone.now()
    today = now.date()
    current_time = now.time()

    if session_id:
        # Student selected a specific session
        try:
            session = ClassSession.objects.get(id=session_id, cancelled=False)
        except ClassSession.DoesNotExist:
            return Response(
                {'error': 'Session not found or has been cancelled.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        # Verify student is enrolled in this course
        enrolled = StudentEnrollment.objects.filter(
            student=student, course=session.course
        ).exists()
        if not enrolled:
            return Response(
                {'error': 'You are not enrolled in this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )
    else:
        # Find active class sessions for today that the student is enrolled in
        enrolled_course_ids = StudentEnrollment.objects.filter(
            student=student
        ).values_list('course_id', flat=True)

        active_sessions = ClassSession.objects.filter(
            course_id__in=enrolled_course_ids,
            date=today,
            cancelled=False,
            start_time__lte=current_time,
            end_time__gte=current_time,
        )

        if not active_sessions.exists():
            return Response(
                {'error': 'No active class sessions found for you at this time.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if active_sessions.count() > 1:
            # Multiple sessions active - return list for student to choose
            return Response({
                'multiple_sessions': True,
                'sessions': ClassSessionSerializer(active_sessions, many=True).data,
                'message': 'Multiple active classes found. Please select one.',
            })

        session = active_sessions.first()

    # Check if already marked
    existing = Attendance.objects.filter(student=student, class_session=session).first()
    if existing:
        return Response(
            {'error': 'Attendance already marked for this class session.'},
            status=status.HTTP_409_CONFLICT,
        )

    # Create attendance record
    attendance = Attendance.objects.create(
        student=student,
        class_session=session,
        status='present',
    )

    from system_logs.models import SystemLog
    SystemLog.objects.create(
        action=f'Attendance marked: {student.matric_number} for {session.course.code} on {session.date}'
    )

    return Response({
        'message': f'Attendance recorded for {session.course.code} - {session.course.title}.',
        'attendance_id': attendance.id,
        'course': session.course.code,
        'course_title': session.course.title,
        'date': str(session.date),
        'time': str(attendance.timestamp),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def student_history(request):
    """
    Student views their attendance history.
    Requires fingerprint_id + OTP for verification.
    POST because we need to verify identity first.
    """
    fingerprint_id = request.data.get('fingerprint_id')
    otp_code = request.data.get('otp')

    if not fingerprint_id or not otp_code:
        return Response(
            {'error': 'Fingerprint ID and OTP are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        student = StudentProfile.objects.get(fingerprint_id=int(fingerprint_id))
    except (StudentProfile.DoesNotExist, ValueError):
        return Response(
            {'error': 'Invalid fingerprint ID.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Verify OTP
    is_valid, error_msg = verify_otp(int(fingerprint_id), otp_code)
    if not is_valid:
        return Response({'error': error_msg}, status=status.HTTP_401_UNAUTHORIZED)

    records = Attendance.objects.filter(
        student=student
    ).select_related('class_session', 'class_session__course').order_by('-class_session__date')

    serializer = AttendanceSerializer(records, many=True)
    return Response({
        'student_name': student.full_name,
        'matric_number': student.matric_number,
        'records': serializer.data,
    })


# --- Lecturer endpoints (JWT protected) ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def session_list(request):
    """
    GET: List class sessions for a course (query param: course_id).
    POST: Create a new class session.
    """
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sessions = ClassSession.objects.filter(course_id=course_id)
        serializer = ClassSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    # POST - create session
    serializer = ClassSessionCreateSerializer(data=request.data)
    if serializer.is_valid():
        session = serializer.save()

        from system_logs.models import SystemLog
        SystemLog.objects.create(
            user=request.user,
            action=f'Class session created: {session.course.code} on {session.date}'
        )

        return Response(
            ClassSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def session_detail(request, pk):
    """Update or delete a class session."""
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        session = ClassSession.objects.get(pk=pk)
    except ClassSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        # Allow toggling cancelled and updating fields
        for field in ['date', 'start_time', 'end_time', 'attendance_window_minutes', 'cancelled']:
            if field in request.data:
                setattr(session, field, request.data[field])
        session.save()
        return Response(ClassSessionSerializer(session).data)

    if request.method == 'DELETE':
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_attendance(request, pk):
    """Get attendance records for a specific session."""
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        session = ClassSession.objects.get(pk=pk)
    except ClassSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Get all enrolled students for this course
    enrolled_students = StudentEnrollment.objects.filter(
        course=session.course
    ).select_related('student')

    # Get actual attendance records
    attendance_map = {}
    for record in Attendance.objects.filter(class_session=session):
        attendance_map[record.student_id] = record

    result = []
    for enrollment in enrolled_students:
        student = enrollment.student
        record = attendance_map.get(student.id)
        result.append({
            'student_id': student.id,
            'matric_number': student.matric_number,
            'full_name': student.full_name,
            'status': record.status if record else 'absent',
            'attendance_id': record.id if record else None,
            'timestamp': record.timestamp if record else None,
        })

    return Response({
        'session': ClassSessionSerializer(session).data,
        'records': result,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def override_attendance(request, pk):
    """Lecturer: override attendance status for a record."""
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AttendanceOverrideSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        record = Attendance.objects.get(pk=pk)
    except Attendance.DoesNotExist:
        # If no record exists, we might need to create one (for marking absent -> excused)
        return Response({'error': 'Attendance record not found.'}, status=status.HTTP_404_NOT_FOUND)

    old_status = record.status
    record.status = serializer.validated_data['status']
    record.save()

    from system_logs.models import SystemLog
    SystemLog.objects.create(
        user=request.user,
        action=f'Attendance override: {record.student.matric_number} '
               f'{old_status} -> {record.status} for {record.class_session}'
    )

    return Response(AttendanceSerializer(record).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_attendance_record(request):
    """Lecturer: manually create an attendance record (for excused absences etc.)."""
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get('student_id')
    session_id = request.data.get('session_id')
    record_status = request.data.get('status', 'excused')

    try:
        student = StudentProfile.objects.get(id=student_id)
        session = ClassSession.objects.get(id=session_id)
    except (StudentProfile.DoesNotExist, ClassSession.DoesNotExist):
        return Response({'error': 'Student or session not found.'}, status=status.HTTP_404_NOT_FOUND)

    record, created = Attendance.objects.get_or_create(
        student=student,
        class_session=session,
        defaults={'status': record_status}
    )

    if not created:
        record.status = record_status
        record.save()

    return Response(AttendanceSerializer(record).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_report(request, course_id):
    """
    Lecturer: get attendance report for a course.
    Returns:
      - Per-student summary (attended, absent, percentage)
      - Sessions list with dates + week numbers
      - Per-student per-session attendance matrix
    """
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    # All sessions ordered by date (ascending for week numbering)
    all_sessions = ClassSession.objects.filter(
        course=course, cancelled=False
    ).order_by('date', 'start_time')

    total_sessions = all_sessions.count()

    # Build sessions list with week numbers
    sessions_data = []
    for idx, session in enumerate(all_sessions):
        sessions_data.append({
            'id': session.id,
            'date': str(session.date),
            'start_time': str(session.start_time)[:5],
            'end_time': str(session.end_time)[:5],
            'week': idx + 1,
            'day_name': session.date.strftime('%a'),
        })

    # Build a lookup: (student_id, session_id) -> status
    all_records = Attendance.objects.filter(
        class_session__in=all_sessions
    ).select_related('student', 'class_session')

    attendance_map = {}
    for record in all_records:
        attendance_map[(record.student_id, record.class_session_id)] = record.status

    # Get all enrolled students
    enrolled = StudentEnrollment.objects.filter(course=course).select_related('student')

    report_data = []
    for enrollment in enrolled:
        student = enrollment.student
        present_count = 0
        session_statuses = []

        for session in all_sessions:
            status_val = attendance_map.get((student.id, session.id), 'absent')
            if status_val in ('present', 'excused'):
                present_count += 1
            session_statuses.append({
                'session_id': session.id,
                'status': status_val,
            })

        percentage = (present_count / total_sessions * 100) if total_sessions > 0 else 0

        report_data.append({
            'student_id': student.id,
            'matric_number': student.matric_number,
            'full_name': student.full_name,
            'total_sessions': total_sessions,
            'attended': present_count,
            'absent': total_sessions - present_count,
            'percentage': round(percentage, 1),
            'session_statuses': session_statuses,
        })

    return Response({
        'course': {
            'id': course.id,
            'code': course.code,
            'title': course.title,
        },
        'total_sessions': total_sessions,
        'sessions': sessions_data,
        'report': report_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_report(request, course_id):
    """
    Lecturer: export attendance report as CSV.
    """
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    import csv

    total_sessions = ClassSession.objects.filter(course=course, cancelled=False).count()
    enrolled = StudentEnrollment.objects.filter(course=course).select_related('student')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{course.code}_attendance_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Matric Number', 'Name', 'Total Sessions', 'Attended', 'Absent', 'Percentage (%)'])

    for enrollment in enrolled:
        student = enrollment.student
        present_count = Attendance.objects.filter(
            student=student,
            class_session__course=course,
            class_session__cancelled=False,
            status__in=['present', 'excused'],
        ).count()
        percentage = (present_count / total_sessions * 100) if total_sessions > 0 else 0

        writer.writerow([
            student.matric_number,
            student.full_name,
            total_sessions,
            present_count,
            total_sessions - present_count,
            round(percentage, 1),
        ])

    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_grades(request, course_id):
    """
    Lecturer: calculate grades for a course.
    Expects JSON body with:
    - attendance_marks: total marks for attendance (e.g., 10)
    - components: list of {name, max_marks, scores: {student_id: score}}
    - grading_scale: optional custom scale
    """
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

    attendance_marks = request.data.get('attendance_marks', 10)
    components = request.data.get('components', [])

    # Default grading scale
    grading_scale = request.data.get('grading_scale', [
        {'min': 70, 'max': 100, 'grade': 'A', 'gp': 5.0},
        {'min': 60, 'max': 69, 'grade': 'B', 'gp': 4.0},
        {'min': 50, 'max': 59, 'grade': 'C', 'gp': 3.0},
        {'min': 45, 'max': 49, 'grade': 'D', 'gp': 2.0},
        {'min': 40, 'max': 44, 'grade': 'E', 'gp': 1.0},
        {'min': 0, 'max': 39, 'grade': 'F', 'gp': 0.0},
    ])

    total_sessions = ClassSession.objects.filter(course=course, cancelled=False).count()
    enrolled = StudentEnrollment.objects.filter(course=course).select_related('student')

    results = []
    for enrollment in enrolled:
        student = enrollment.student
        # Calculate attendance score
        present_count = Attendance.objects.filter(
            student=student,
            class_session__course=course,
            class_session__cancelled=False,
            status__in=['present', 'excused'],
        ).count()

        att_score = (present_count / total_sessions * attendance_marks) if total_sessions > 0 else 0

        # Sum other components
        other_scores = 0
        max_other = 0
        for comp in components:
            scores = comp.get('scores', {})
            student_score = scores.get(str(student.id), 0)
            other_scores += student_score
            max_other += comp.get('max_marks', 0)

        total_score = round(att_score + other_scores, 1)

        # Determine grade
        letter_grade = 'F'
        grade_point = 0.0
        for scale in grading_scale:
            if scale['min'] <= total_score <= scale['max']:
                letter_grade = scale['grade']
                grade_point = scale['gp']
                break

        results.append({
            'student_id': student.id,
            'matric_number': student.matric_number,
            'full_name': student.full_name,
            'attendance_score': round(att_score, 1),
            'other_scores': round(other_scores, 1),
            'total_score': total_score,
            'letter_grade': letter_grade,
            'grade_point': grade_point,
        })

    return Response({
        'course': {'id': course.id, 'code': course.code, 'title': course.title},
        'attendance_marks': attendance_marks,
        'total_sessions': total_sessions,
        'results': results,
    })


# --- Timetable endpoints ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def timetable_list(request):
    """
    GET:  List timetable slots (filter by course_id query param).
    POST: Create a new timetable slot (admin only).
    """
    if not request.user.is_lecturer and not request.user.is_admin:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        course_id = request.query_params.get('course_id')
        if course_id:
            slots = CourseTimetable.objects.filter(course_id=course_id)
        else:
            slots = CourseTimetable.objects.all()
        serializer = CourseTimetableSerializer(slots, many=True)
        return Response(serializer.data)

    # POST - admin only
    if not request.user.is_admin:
        return Response({'error': 'Only admins can create timetable slots.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CourseTimetableCreateSerializer(data=request.data)
    if serializer.is_valid():
        slot = serializer.save()
        from system_logs.models import SystemLog
        SystemLog.objects.create(
            user=request.user,
            action=f'Timetable slot created: {slot}'
        )
        return Response(
            CourseTimetableSerializer(slot).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def timetable_delete(request, pk):
    """Delete a timetable slot (admin only)."""
    if not request.user.is_admin:
        return Response({'error': 'Only admins can delete timetable slots.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        slot = CourseTimetable.objects.get(pk=pk)
    except CourseTimetable.DoesNotExist:
        return Response({'error': 'Timetable slot not found.'}, status=status.HTTP_404_NOT_FOUND)

    slot.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_sessions(request):
    """
    Bulk-generate ClassSession records from a timetable slot.
    POST body: { timetable_id: int }
    Iterates from semester_start for num_weeks, creates sessions on matching day_of_week.
    Skips dates where a session already exists for that course+date+time.
    """
    if not request.user.is_admin:
        return Response({'error': 'Only admins can generate sessions.'}, status=status.HTTP_403_FORBIDDEN)

    timetable_id = request.data.get('timetable_id')
    if not timetable_id:
        return Response({'error': 'timetable_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        slot = CourseTimetable.objects.get(pk=timetable_id)
    except CourseTimetable.DoesNotExist:
        return Response({'error': 'Timetable slot not found.'}, status=status.HTTP_404_NOT_FOUND)

    created_count = 0
    skipped_count = 0
    current_date = slot.semester_start

    # Find the first occurrence of the target day_of_week on or after semester_start
    # Python weekday(): Monday=0,...,Friday=4 — matches our DAY_CHOICES
    days_ahead = slot.day_of_week - current_date.weekday()
    if days_ahead < 0:
        days_ahead += 7
    current_date = current_date + timedelta(days=days_ahead)

    for week in range(slot.num_weeks):
        session_date = current_date + timedelta(weeks=week)

        # Check if session already exists for this course+date+start_time
        exists = ClassSession.objects.filter(
            course=slot.course,
            date=session_date,
            start_time=slot.start_time,
        ).exists()

        if exists:
            skipped_count += 1
            continue

        ClassSession.objects.create(
            course=slot.course,
            date=session_date,
            start_time=slot.start_time,
            end_time=slot.end_time,
            attendance_window_minutes=slot.attendance_window_minutes,
        )
        created_count += 1

    from system_logs.models import SystemLog
    SystemLog.objects.create(
        user=request.user,
        action=f'Sessions generated for {slot.course.code}: '
               f'{created_count} created, {skipped_count} skipped'
    )

    return Response({
        'message': f'Generated {created_count} sessions for {slot.course.code}.',
        'created': created_count,
        'skipped': skipped_count,
        'course_code': slot.course.code,
    })
