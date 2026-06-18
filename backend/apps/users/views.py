from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from apps.core.throttling import AuthRegisterThrottle, AuthResendThrottle
from .models import EmailVerificationToken
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer,
    RegisterSerializer, ResendVerificationSerializer,
)
from .services import create_verification_token, send_verification_email

User = get_user_model()
RESEND_SUCCESS_MESSAGE = 'Если аккаунт существует и не подтверждён, письмо отправлено.'


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = create_verification_token(user)
        try:
            send_verification_email(user, token)
        except Exception:
            user.delete()
            return Response(
                {'detail': 'Не удалось отправить письмо. Попробуйте позже.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {'message': 'Письмо с подтверждением отправлено на ваш email.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get('token')
        if not token_str:
            return Response({'detail': 'Токен не указан.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except EmailVerificationToken.DoesNotExist:
            return Response({'detail': 'Недействительная ссылка подтверждения.'}, status=status.HTTP_400_BAD_REQUEST)

        if token.is_used:
            return Response({'detail': 'Ссылка уже была использована.'}, status=status.HTTP_400_BAD_REQUEST)
        if not token.is_valid():
            return Response({'detail': 'Срок действия ссылки истёк. Запросите новое письмо.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        token.is_used = True
        token.save(update_fields=['is_used'])

        return Response({'message': 'Email успешно подтверждён. Теперь вы можете войти.'})


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthResendThrottle]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            user = None

        if user and not user.is_active:
            token = create_verification_token(user)
            try:
                send_verification_email(user, token)
            except Exception:
                return Response(
                    {'detail': 'Не удалось отправить письмо. Попробуйте позже.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        return Response({'message': RESEND_SUCCESS_MESSAGE})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        s = UserSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)
