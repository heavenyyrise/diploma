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
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='orders', verbose_name='Пользователь',
        null=True, blank=True,
    )
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
        if self.status == 'completed':
            if not self.completed_at:
                from .validators import resolve_completed_at
                self.completed_at = resolve_completed_at(self.deadline)
        else:
            self.completed_at = None
        super().save(*args, **kwargs)


class OrderChangeLog(models.Model):
    FIELD_CHOICES = [
        ('created', 'Создание'),
        ('price', 'Сумма'),
        ('status', 'Статус'),
        ('title', 'Название'),
        ('description', 'Описание'),
        ('deadline', 'Дедлайн'),
        ('client', 'Клиент'),
        ('services', 'Услуги'),
    ]

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE,
        related_name='change_logs', verbose_name='Заказ',
    )
    field = models.CharField(max_length=50, choices=FIELD_CHOICES, verbose_name='Поле')
    old_value = models.TextField(blank=True, verbose_name='Было')
    new_value = models.TextField(blank=True, verbose_name='Стало')
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата изменения')
    changed_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='order_changes',
        verbose_name='Изменил',
    )

    class Meta:
        verbose_name = 'Изменение заказа'
        verbose_name_plural = 'Изменения заказов'
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.order_id} — {self.field}'


class OrderAttachment(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE,
        related_name='attachments', verbose_name='Заказ',
    )
    file = models.FileField(upload_to='orders/%Y/%m/', verbose_name='Файл')
    original_name = models.CharField(max_length=255, verbose_name='Имя файла')
    file_size = models.PositiveIntegerField(verbose_name='Размер (байт)')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Загружен')
    uploaded_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='order_attachments',
        verbose_name='Загрузил',
    )

    class Meta:
        verbose_name = 'Вложение заказа'
        verbose_name_plural = 'Вложения заказов'
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_name
