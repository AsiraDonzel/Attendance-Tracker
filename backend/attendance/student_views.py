"""
Views specifically for the Student Portal.
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import timedelta

from .models import ClassSession, Attendance
from accounts.models import StudentProfile
from courses.models import Course, StudentEnrollment


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    """
    Returns data for the Student Dashboard:
    - Profile info
    - Today's schedule (with active/inactive status)
    - Weekly schedule
    - Attendance summary per course
    - Upcoming sessions
    """
    if not request.user.is_student:
        return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        profile = request.user.student_profile
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    now = timezone.now()
    today = now.date()

    # Calculate Monday and Friday of current week
    monday = today - timedelta(days=today.weekday())
    friday = monday + timedelta(days=4)

    enrolled_courses = Course.objects.filter(student_enrollments__student=profile)

    # 1. Weekly Schedule (all non-cancelled sessions this week)
    weekly_sessions = ClassSession.objects.filter(
        course__in=enrolled_courses,
        date__range=[monday, friday],
        cancelled=False
    ).select_related('course').order_by('date', 'start_time')

    weekly_data = []
    today_courses = []
    upcoming_classes = []

    for session in weekly_sessions:
        session_data = {
            'id': session.id,
            'course_id': session.course.id,
            'course_code': session.course.code,
            'course_title': session.course.title,
            'date': str(session.date),
            'day_name': session.date.strftime('%A'),
            'start_time': str(session.start_time)[:5],
            'end_time': str(session.end_time)[:5],
            'venue': f"{session.course.department} Lab",  # Placeholder venue
        }
        weekly_data.append(session_data)

        # 2. Today's Courses with status
        if session.date == today:
            status_tag = 'inactive'
            
            # Check if timeframe passed
            session_end = timezone.make_aware(timezone.datetime.combine(today, session.end_time))
            if now > session_end:
                status_tag = 'completed'
            else:
                # Check if it's currently active (within start_time and start_time + window)
                session_start = timezone.make_aware(timezone.datetime.combine(today, session.start_time))
                window_end = session_start + timedelta(minutes=session.attendance_window_minutes)
                
                if session_start <= now <= window_end:
                    status_tag = 'active'
                elif now < session_start:
                    status_tag = 'upcoming_today'
            
            # Check if student already marked
            attendance = Attendance.objects.filter(student=profile, class_session=session).first()
            if attendance:
                status_tag = 'marked'

            today_courses.append({
                **session_data,
                'status': status_tag,
                'window_minutes': session.attendance_window_minutes
            })

    # 3. Upcoming Classes (next 3 classes from now)
    future_sessions = ClassSession.objects.filter(
        course__in=enrolled_courses,
        date__gte=today,
        cancelled=False
    ).select_related('course').order_by('date', 'start_time')
    
    for session in future_sessions:
        session_start = timezone.make_aware(timezone.datetime.combine(session.date, session.start_time))
        if session_start > now and len(upcoming_classes) < 3:
            upcoming_classes.append({
                'id': session.id,
                'course_code': session.course.code,
                'date': str(session.date),
                'start_time': str(session.start_time)[:5],
            })

    # 4. Attendance Summary per Course
    summary_data = []
    all_sessions_for_student = ClassSession.objects.filter(
        course__in=enrolled_courses,
        cancelled=False
    )
    # only count sessions up to today
    past_sessions = all_sessions_for_student.filter(date__lte=today)
    
    # Pre-fetch attendance for this student
    student_attendances = Attendance.objects.filter(
        student=profile, 
        class_session__in=past_sessions,
        status__in=['present', 'excused']
    ).values_list('class_session_id', flat=True)

    for course in enrolled_courses:
        course_past_sessions = [s for s in past_sessions if s.course_id == course.id]
        total_held = len(course_past_sessions)
        
        attended = len([s for s in course_past_sessions if s.id in student_attendances])
        
        percentage = (attended / total_held * 100) if total_held > 0 else 0
        
        summary_data.append({
            'course_id': course.id,
            'course_code': course.code,
            'course_title': course.title,
            'total_held': total_held,
            'attended': attended,
            'percentage': round(percentage, 1)
        })

    return Response({
        'profile': {
             'full_name': profile.full_name,
             'matric_number': profile.matric_number,
             'department': profile.department,
             'level': profile.level,
             'fingerprint_id': profile.fingerprint_id,
        },
        'today_courses': today_courses,
        'weekly_schedule': weekly_data,
        'attendance_summary': summary_data,
        'upcoming_classes': upcoming_classes,
        'current_week_number': 1, # hardcoded MVP
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request):
    """
    Returns list of courses the student is enrolled in.
    """
    if not request.user.is_student:
        return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)
        
    enrolled = StudentEnrollment.objects.filter(student=request.user.student_profile).select_related('course')
    
    courses_data = []
    for enr in enrolled:
        courses_data.append({
            'id': enr.course.id,
            'code': enr.course.code,
            'title': enr.course.title,
            'credits': enr.course.credits,
            'department': enr.course.department,
            'level': enr.course.level,
        })
        
    return Response(courses_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_history(request):
    """
    Returns detailed history of all past class sessions and the student's attendance status.
    """
    if not request.user.is_student:
        return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)
        
    enrolled_courses = Course.objects.filter(student_enrollments__student=request.user.student_profile)
    
    past_sessions = ClassSession.objects.filter(
        course__in=enrolled_courses,
        date__lte=timezone.now().date(),
        cancelled=False
    ).select_related('course').order_by('-date', '-start_time')
    
    attendances = Attendance.objects.filter(
        student=request.user.student_profile,
        class_session__in=past_sessions
    )
    attendance_map = {a.class_session_id: a.status for a in attendances}
    
    history_data = []
    for session in past_sessions:
        status_val = attendance_map.get(session.id, 'absent')
        history_data.append({
            'id': session.id,
            'course_code': session.course.code,
            'course_title': session.course.title,
            'date': str(session.date),
            'start_time': str(session.start_time)[:5],
            'end_time': str(session.end_time)[:5],
            'status': status_val
        })
        
    return Response(history_data)
