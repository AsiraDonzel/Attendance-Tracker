import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from accounts.models import StudentProfile
from courses.models import Course, StudentEnrollment
from attendance.models import ClassSession, Attendance

User = get_user_model()

def seed_test_data():
    print("Seeding test data for AttendTrack MVP...")

    # 0. Create Admin User
    admin_user, created = User.objects.get_or_create(
        email='admin@system.com',
        defaults={
            'username': 'admin_system',
            'is_admin': True,
            'is_staff': True,
        }
    )
    if created:
        admin_user.set_password('Admin@1234')
        admin_user.save()
        print("Created admin user (admin@system.com / Admin@1234).")
    else:
        print("Admin user already exists.")

    # 1. Create User and StudentProfile for Test Student (999)
    email = 'teststudent@attendtrack.edu'
    try:
        user = User.objects.get(email=email)
        print("Test user already exists.")
    except User.DoesNotExist:
        user = User.objects.create(
            username=email,
            email=email,
            is_student=True
        )
        user.set_unusable_password()
        user.save()
        print("Created test user.")

    try:
        profile = StudentProfile.objects.get(fingerprint_id=999)
        print("Test profile already exists.")
    except StudentProfile.DoesNotExist:
        profile = StudentProfile.objects.create(
            user=user,
            full_name="Testing Student",
            matric_number="TEST/2026/999",
            level="300L",
            department="Computer",
            fingerprint_id=999,
        )
        print("Created test profile.")

    # 2. Create Course (Computer Engineering 301)
    course, created = Course.objects.get_or_create(
        code="CPE 301",
        title="Introduction to Microprocessors",
        level="300L",
        department="Computer",
        defaults={'credits': 3}
    )
    if created:
        print("Created course CPE 301.")

    # 3. Enroll Student
    enrollment, created = StudentEnrollment.objects.get_or_create(
        student=profile,
        course=course
    )
    if created:
        print("Enrolled test student in CPE 301.")

    # 4. Create class sessions
    now = timezone.now()
    today = now.date()

    # Past session (yesterday)
    past_session, created = ClassSession.objects.get_or_create(
        course=course,
        date=today - timedelta(days=1),
        defaults={
            'start_time': (now - timedelta(hours=2)).time(),
            'end_time': now.time(),
            'attendance_window_minutes': 30
        }
    )
    if created:
        print("Created past session.")
        # Mark attendance for past session
        Attendance.objects.create(
            student=profile,
            class_session=past_session,
            status='present'
        )
        print("Marked student present for past session.")

    # Active session (today, right now)
    active_session, created = ClassSession.objects.get_or_create(
        course=course,
        date=today,
        defaults={
            'start_time': (now - timedelta(minutes=10)).time(),
            'end_time': (now + timedelta(hours=2)).time(),
            'attendance_window_minutes': 30
        }
    )
    if created:
        print("Created active session for today.")
    else:
        # Update it to ensure it's active now
        active_session.start_time = (now - timedelta(minutes=10)).time()
        active_session.end_time = (now + timedelta(hours=2)).time()
        active_session.save()
        print("Updated active session times for today.")

    # Future session (tomorrow)
    future_session, created = ClassSession.objects.get_or_create(
        course=course,
        date=today + timedelta(days=1),
        defaults={
            'start_time': (now + timedelta(hours=2)).time(),
            'end_time': (now + timedelta(hours=4)).time(),
            'attendance_window_minutes': 30
        }
    )
    if created:
        print("Created future session.")

    print("Test data seeding complete.")

if __name__ == "__main__":
    seed_test_data()
