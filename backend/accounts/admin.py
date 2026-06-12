from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, LecturerProfile


# ── Custom User admin ──────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('email', 'username', 'is_student', 'is_lecturer', 'is_admin', 'is_staff', 'is_superuser')
    list_filter   = ('is_student', 'is_lecturer', 'is_admin', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username')
    ordering      = ('email',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Flags', {'fields': ('is_student', 'is_lecturer', 'is_admin')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Flags', {'fields': ('is_student', 'is_lecturer', 'is_admin')}),
    )


# ── Student Profile admin ──────────────────────────────────────
@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display   = ('full_name', 'matric_number', 'fingerprint_id', 'level', 'department', 'has_totp_secret')
    list_filter    = ('level', 'department')
    search_fields  = ('full_name', 'matric_number', 'fingerprint_id')
    ordering       = ('full_name',)
    readonly_fields = ('user',)

    fieldsets = (
        ('Identity', {
            'fields': ('user', 'full_name', 'matric_number')
        }),
        ('Academic', {
            'fields': ('level', 'department')
        }),
        ('Hardware / TOTP', {
            'description': (
                'fingerprint_id must match the Arduino slot used during enrolment. '
                'totp_secret is the Base32 string printed on the Arduino Serial Monitor after enrolment.'
            ),
            'fields': ('fingerprint_id', 'totp_secret')
        }),
    )

    def has_totp_secret(self, obj):
        return bool(obj.totp_secret)
    has_totp_secret.boolean     = True
    has_totp_secret.short_description = 'TOTP Set'


# ── Lecturer Profile admin ─────────────────────────────────────
@admin.register(LecturerProfile)
class LecturerProfileAdmin(admin.ModelAdmin):
    list_display  = ('full_name_display', 'title', 'department', 'levels_taught', 'phone', 'office_number')
    list_filter   = ('department', 'title')
    search_fields = ('first_name', 'last_name', 'user__email')
    ordering      = ('last_name',)

    def full_name_display(self, obj):
        return f"{obj.title} {obj.last_name}, {obj.first_name}"
    full_name_display.short_description = 'Name'
