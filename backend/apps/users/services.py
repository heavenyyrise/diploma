from django.conf import settings
from apps.core.email import send_email
from .models import EmailVerificationToken


def create_verification_token(user):
    EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)
    return EmailVerificationToken.objects.create(user=user)


def send_verification_email(user, token_obj):
    verify_url = f'{settings.FRONTEND_URL}/verify-email?token={token_obj.token}'
    send_email(
        to=user.email,
        subject='Подтверждение регистрации — Freelancer ARM',
        template_name='verify_email',
        context={
            'name': user.first_name or user.email,
            'verify_url': verify_url,
        },
    )
