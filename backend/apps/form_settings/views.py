from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import FormSettings
from .serializers import FormSettingsSerializer, FormSettingsPublicSerializer

class FormSettingsPublicView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response(FormSettingsPublicSerializer(FormSettings.get_instance()).data)

class FormSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(FormSettingsSerializer(FormSettings.get_instance()).data)
    def patch(self, request):
        obj = FormSettings.get_instance()
        s = FormSettingsSerializer(obj, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(FormSettingsSerializer(obj).data)
