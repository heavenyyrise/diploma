import socket

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Проверка настроек почты: backend, From, доступность SMTP (если используется)'

    def handle(self, *args, **options):
        self.stdout.write(f'EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
        self.stdout.write(f'DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')

        if settings.EMAIL_BACKEND == 'anymail.backends.resend.EmailBackend':
            self.stdout.write(self.style.SUCCESS('Resend API — SMTP-порты не нужны.'))
            return

        host = getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com')
        port = getattr(settings, 'EMAIL_PORT', 587)
        self.stdout.write(f'SMTP: {host}:{port} (TLS={getattr(settings, "EMAIL_USE_TLS", False)})')

        try:
            with socket.create_connection((host, port), timeout=5):
                self.stdout.write(self.style.SUCCESS(f'Порт {port} на {host} доступен.'))
        except OSError as exc:
            self.stdout.write(
                self.style.ERROR(
                    f'Порт {port} на {host} недоступен: {exc}. '
                    'На Railway Hobby SMTP заблокирован — задайте RESEND_API_KEY.'
                )
            )
