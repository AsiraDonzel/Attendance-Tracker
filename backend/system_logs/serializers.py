"""
Serializers for system logs.
"""
from rest_framework import serializers
from .models import SystemLog


class SystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default='System')

    class Meta:
        model = SystemLog
        fields = ['id', 'user', 'user_email', 'action', 'timestamp']
