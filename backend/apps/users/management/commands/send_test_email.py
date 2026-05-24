from django.core.management.base import BaseCommand, CommandError
from apps.core.email import send_email


class Command(BaseCommand):
    help = 'Send a test email via configured Google SMTP'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Recipient email address')
        parser.add_argument(
            '--reply-to',
            type=str,
            default=None,
            help='Optional Reply-To address',
        )

    def handle(self, *args, **options):
        to = options['email']
        reply_to = options.get('reply_to')
        try:
            send_email(
                to=to,
                subject='Freelancer ARM — тестовое письмо',
                template_name='verify_email',
                context={
                    'name': 'Тест',
                    'verify_url': 'https://example.com/verify-email?token=test',
                },
                reply_to=reply_to,
            )
        except Exception as exc:
            raise CommandError(f'Failed to send email: {exc}') from exc
        self.stdout.write(self.style.SUCCESS(f'Test email sent to {to}'))
