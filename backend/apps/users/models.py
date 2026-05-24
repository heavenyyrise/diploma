import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='Email')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='Аватар')
    reply_to_email = models.EmailField(blank=True, verbose_name='Email для ответов клиентов')

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.username


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='verification_tokens', verbose_name='Пользователь',
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    is_used = models.BooleanField(default=False, verbose_name='Использован')

    class Meta:
        verbose_name = 'Токен подтверждения email'
        verbose_name_plural = 'Токены подтверждения email'

    def __str__(self):
        return f'{self.user.email} — {self.token}'

    def is_valid(self):
        if self.is_used:
            return False
        return timezone.now() - self.created_at < timedelta(hours=24)
