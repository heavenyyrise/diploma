from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def send_email(to, subject, template_name, context=None, reply_to=None):
    """Send HTML email via Google SMTP. From = DEFAULT_FROM_EMAIL (with display name)."""
    context = context or {}
    html_body = render_to_string(f'emails/{template_name}.html', context)
    try:
        text_body = render_to_string(f'emails/{template_name}.txt', context)
    except Exception:
        text_body = None

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body or html_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to] if isinstance(to, str) else to,
        reply_to=[reply_to] if reply_to else None,
    )
    if text_body:
        msg.attach_alternative(html_body, 'text/html')
    else:
        msg.content_subtype = 'html'
        msg.body = html_body
    msg.send()
