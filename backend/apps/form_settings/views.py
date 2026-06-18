from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.throttling import PublicFormThrottle
from .models import FormSettings
from .serializers import FormSettingsSerializer, FormSettingsPublicSerializer

User = get_user_model()


class FormSettingsPublicView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PublicFormThrottle]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'user_id': 'Обязательный параметр'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            owner = User.objects.get(pk=user_id, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'user_id': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
        obj, _ = FormSettings.objects.get_or_create(user=owner)
        return Response(FormSettingsPublicSerializer(obj).data)


class FormSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        obj, _ = FormSettings.objects.get_or_create(user=request.user)
        return Response(FormSettingsSerializer(obj).data)

    def patch(self, request):
        obj, _ = FormSettings.objects.get_or_create(user=request.user)
        s = FormSettingsSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(FormSettingsSerializer(obj).data)
