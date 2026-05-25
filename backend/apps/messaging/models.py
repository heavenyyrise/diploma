from django.db import models


class EmailTemplate(models.Model):
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='email_templates', verbose_name='Пользователь',
    )
    name = models.CharField(max_length=255, verbose_name='Название')
    subject = models.CharField(max_length=255, verbose_name='Тема')
    body = models.TextField(verbose_name='Текст')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        verbose_name = 'Шаблон письма'
        verbose_name_plural = 'Шаблоны писем'
        ordering = ['name']

    def __str__(self):
        return self.name


class SentEmail(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Отправлено'),
        ('failed', 'Ошибка'),
    ]

    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='sent_emails', verbose_name='Пользователь',
    )
    to_email = models.EmailField(verbose_name='Кому')
    subject = models.CharField(max_length=255, verbose_name='Тема')
    body = models.TextField(verbose_name='Текст')
    order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_emails', verbose_name='Заказ',
    )
    client = models.ForeignKey(
        'clients.Client', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_emails', verbose_name='Клиент',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name='Статус')
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата отправки')
    error_message = models.TextField(blank=True, verbose_name='Ошибка')

    class Meta:
        verbose_name = 'Отправленное письмо'
        verbose_name_plural = 'Отправленные письма'
        ordering = ['-sent_at']

    def __str__(self):
        return f'{self.to_email} — {self.subject}'
