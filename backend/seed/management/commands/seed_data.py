"""
Management command to seed the database with test data.

Creates:
- Admin account (admin@system.com / Admin@1234)
- Test student (fingerprint 999, matric 21/ENG02/999, OTP: 482391)
- Test lecturer (test@lecturer.com / Test@1234)
- Sample course (CSC 301 - Computer Architecture)
- Sample class session (today, 08:00-17:00)
- Enrollment and assignment links
"""
from datetime import date, time

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from accounts.models import StudentProfile, LecturerProfile
from courses.models import Course, StudentEnrollment, LecturerAssignment
from attendance.models import ClassSession
from system_logs.models import SystemLog

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with test accounts and sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...\n')

        # --- Admin Account ---
        admin_user, created = User.objects.get_or_create(
            email='admin@system.com',
            defaults={
                'username': 'admin',
                'is_admin': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('Admin@1234')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('  Created admin: admin@system.com / Admin@1234'))
        else:
            self.stdout.write('  Admin already exists, skipping.')

        # --- Test Student ---
        student_user, created = User.objects.get_or_create(
            email='test.student@university.edu',
            defaults={
                'username': 'test_student_999',
                'is_student': True,
            }
        )
        if created:
            student_user.set_unusable_password()
            student_user.save()

        student_profile, created = StudentProfile.objects.get_or_create(
            fingerprint_id=999,
            defaults={
                'user': student_user,
                'full_name': 'Test Student',
                'matric_number': '21/ENG02/999',
                'level': '300L',
                'department': 'Computer',
                'totp_secret': 'JBSWY3DPEHPK3PXP',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                '  Created test student: ID 999, Matric 21/ENG02/999, OTP: 482391'
            ))
        else:
            self.stdout.write('  Test student already exists, skipping.')

        # --- Test Lecturer ---
        lecturer_user, created = User.objects.get_or_create(
            email='test@lecturer.com',
            defaults={
                'username': 'test_lecturer',
                'is_lecturer': True,
            }
        )
        if created:
            lecturer_user.set_password('Test@1234')
            lecturer_user.save()

        lecturer_profile, created = LecturerProfile.objects.get_or_create(
            user=lecturer_user,
            defaults={
                'title': 'Dr',
                'first_name': 'Test',
                'last_name': 'Lecturer',
                'department': 'Computer',
                'levels_taught': ['300L', '400L'],
                'phone': '+234-800-000-0000',
                'office_number': 'ENG-201',
                'num_courses': 3,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                '  Created test lecturer: test@lecturer.com / Test@1234'
            ))
        else:
            self.stdout.write('  Test lecturer already exists, skipping.')

        # --- Sample Courses ---
        courses_data = [
            {'code': 'CSC 301', 'title': 'Computer Architecture', 'level': '300L', 'department': 'Computer', 'credits': 3},
            {'code': 'CSC 303', 'title': 'Operating Systems', 'level': '300L', 'department': 'Computer', 'credits': 3},
            {'code': 'CSC 305', 'title': 'Data Structures & Algorithms', 'level': '300L', 'department': 'Computer', 'credits': 3},
            {'code': 'EEE 301', 'title': 'Circuit Analysis II', 'level': '300L', 'department': 'Electrical', 'credits': 3},
            {'code': 'MEE 201', 'title': 'Engineering Mechanics', 'level': '200L', 'department': 'Mechanical', 'credits': 4},
        ]

        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                code=course_data['code'],
                defaults=course_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created course: {course.code} - {course.title}'))

        # --- Assignments ---
        csc301 = Course.objects.get(code='CSC 301')
        csc303 = Course.objects.get(code='CSC 303')

        LecturerAssignment.objects.get_or_create(lecturer=lecturer_profile, course=csc301)
        LecturerAssignment.objects.get_or_create(lecturer=lecturer_profile, course=csc303)
        self.stdout.write(self.style.SUCCESS('  Assigned test lecturer to CSC 301, CSC 303'))

        # --- Enrollments (auto-enroll test student in matching courses) ---
        matching_courses = Course.objects.filter(
            department=student_profile.department,
            level=student_profile.level,
        )
        for course in matching_courses:
            StudentEnrollment.objects.get_or_create(student=student_profile, course=course)
        self.stdout.write(self.style.SUCCESS(
            f'  Enrolled test student in {matching_courses.count()} matching courses'
        ))

        # --- Sample Class Session (today, wide window for testing) ---
        session, created = ClassSession.objects.get_or_create(
            course=csc301,
            date=date.today(),
            defaults={
                'start_time': time(8, 0),
                'end_time': time(23, 0),
                'attendance_window_minutes': 60,
                'cancelled': False,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                f'  Created class session: CSC 301 today ({date.today()}) 08:00-23:00'
            ))
        else:
            self.stdout.write('  Class session for today already exists, skipping.')

        # --- System Log ---
        SystemLog.objects.create(
            user=admin_user,
            action='Database seeded with test data'
        )

        self.stdout.write(self.style.SUCCESS('\nDatabase seeding complete!'))
        self.stdout.write('\nTest Accounts:')
        self.stdout.write('  Admin:    admin@system.com / Admin@1234')
        self.stdout.write('  Lecturer: test@lecturer.com / Test@1234')
        self.stdout.write('  Student:  Fingerprint ID 999, OTP 482391')
