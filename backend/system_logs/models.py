"""
System log model for tracking user actions.
"""
from django.db import models
from django.conf import settings


class SystemLog(models.Model):
    """Records system events and user actions for audit trail."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs',
    )
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'system_logs'
        ordering = ['-timestamp']

    def __str__(self):
        user_str = self.user.email if self.user else 'System'
        return f"[{self.timestamp}] {user_str}: {self.action}"
