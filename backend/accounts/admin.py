from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
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
    list_display   = ('full_name', 'matric_number', 'fingerprint_id', 'level', 'department', 'totp_secret_display', 'has_totp_secret')
    list_filter    = ('level', 'department')
    search_fields  = ('full_name', 'matric_number', 'fingerprint_id')
    ordering       = ('full_name',)
    readonly_fields = ('user', 'totp_secret_copyable')
    actions        = ['delete_students_with_users']

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
                'totp_secret is the Base32 string printed on the Arduino Serial Monitor '
                'after enrolment. Copy it exactly as shown — all uppercase letters and digits.'
            ),
            'fields': ('fingerprint_id', 'totp_secret', 'totp_secret_copyable')
        }),
    )

    # ── List column: show first 8 chars of secret (or dash) ──
    def totp_secret_display(self, obj):
        if obj.totp_secret:
            return format_html(
                '<code style="font-size:0.82em;letter-spacing:0.03em">{}</code>',
                obj.totp_secret[:8] + '…'
            )
        return format_html('<span style="color:#aaa">—</span>')
    totp_secret_display.short_description = 'TOTP Secret (preview)'

    # ── Detail read-only: full secret in a selectable box ──
    def totp_secret_copyable(self, obj):
        if not obj.totp_secret:
            return format_html(
                '<span style="color:#aaa;font-style:italic">No secret set yet. '
                'Enrol the student on the Arduino device, then paste the Base32 '
                'string into the TOTP Secret field above.</span>'
            )
        return format_html(
            '<input type="text" value="{}" readonly '
            'style="font-family:monospace;font-size:0.9em;letter-spacing:0.05em;'
            'width:100%;padding:6px 10px;border:1px solid #ccc;border-radius:4px;'
            'background:#f8f9fa;cursor:text" '
            'onclick="this.select()" title="Click to select all, then Ctrl+C to copy" />',
            obj.totp_secret
        )
    totp_secret_copyable.short_description = 'TOTP Secret (click to select & copy)'

    # ── Boolean column ──
    def has_totp_secret(self, obj):
        return bool(obj.totp_secret)
    has_totp_secret.boolean = True
    has_totp_secret.short_description = 'TOTP Set'

    # ── Custom delete action that also removes the linked User ──
    @admin.action(description='Delete selected students and their user accounts')
    def delete_students_with_users(self, request, queryset):
        user_ids = list(queryset.values_list('user_id', flat=True))
        count = queryset.count()
        # Deleting the User cascades and removes the StudentProfile too
        User.objects.filter(id__in=user_ids).delete()
        self.message_user(request, f'Successfully deleted {count} student(s) and their login accounts.')

    # ── Override default delete to also clean up the User ──
    def delete_model(self, request, obj):
        """Deleting from the detail page also removes the linked User."""
        obj.user.delete()   # cascades → StudentProfile deleted too


# ── Lecturer Profile admin ─────────────────────────────────────
@admin.register(LecturerProfile)
class LecturerProfileAdmin(admin.ModelAdmin):
    list_display  = ('full_name_display', 'title', 'department', 'levels_taught', 'phone', 'office_number')
    list_filter   = ('department', 'title')
    search_fields = ('first_name', 'last_name', 'user__email')
    ordering      = ('last_name',)
    actions       = ['delete_lecturers_with_users']

    def full_name_display(self, obj):
        return f"{obj.title} {obj.last_name}, {obj.first_name}"
    full_name_display.short_description = 'Name'

    @admin.action(description='Delete selected lecturers and their user accounts')
    def delete_lecturers_with_users(self, request, queryset):
        user_ids = list(queryset.values_list('user_id', flat=True))
        count = queryset.count()
        User.objects.filter(id__in=user_ids).delete()
        self.message_user(request, f'Successfully deleted {count} lecturer(s) and their login accounts.')

    def delete_model(self, request, obj):
        obj.user.delete()
