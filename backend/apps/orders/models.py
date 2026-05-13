from django.db import models


class Order(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'В разработке'),
        ('completed', 'Завершён'),
        ('frozen', 'Заморожен'),
        ('cancelled', 'Отменён'),
    ]
    SOURCE_CHOICES = [
        ('manual', 'Вручную'),
        ('telegram_bot', 'Telegram Бот'),
    ]

    title = models.CharField(max_length=255, verbose_name='Название заказа')
    client = models.ForeignKey(
        'clients.Client', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders', verbose_name='Заказчик'
    )
    services = models.ManyToManyField(
        'services.Service', blank=True,
        related_name='orders', verbose_name='Услуги'
    )
    description = models.TextField(blank=True, verbose_name='ТЗ / Описание')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='in_progress', verbose_name='Статус')
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='manual', verbose_name='Источник создания')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Сумма')
    deadline = models.DateField(null=True, blank=True, verbose_name='Дедлайн')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Завершён')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.get_status_display()}'

    def save(self, *args, **kwargs):
        if self.status == 'completed' and not self.completed_at:
            from django.utils import timezone
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)
