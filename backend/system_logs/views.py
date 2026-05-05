"""
Views for system logs (admin only).
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import SystemLog
from .serializers import SystemLogSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def log_list(request):
    """Admin: list system logs with optional filters."""
    if not request.user.is_admin:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    logs = SystemLog.objects.select_related('user').all()

    # Filter by user
    user_id = request.query_params.get('user_id')
    if user_id:
        logs = logs.filter(user_id=user_id)

    # Filter by action keyword
    action = request.query_params.get('action')
    if action:
        logs = logs.filter(action__icontains=action)

    # Filter by date range
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        logs = logs.filter(timestamp__date__gte=date_from)
    if date_to:
        logs = logs.filter(timestamp__date__lte=date_to)

    # Limit results
    limit = int(request.query_params.get('limit', 100))
    logs = logs[:limit]

    serializer = SystemLogSerializer(logs, many=True)
    return Response(serializer.data)
