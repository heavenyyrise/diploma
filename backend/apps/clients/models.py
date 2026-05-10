from django.db import models
from django.db.models import Sum

class Client(models.Model):
    PLATFORM_CHOICES = [('instagram','Instagram'),('telegram','Telegram'),('kwork','Kwork'),('other','Другое')]
    name = models.CharField(max_length=255, verbose_name='Имя')
    username = models.CharField(max_length=255, blank=True, verbose_name='Никнейм')
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES, default='other', verbose_name='Площадка')
    phone = models.CharField(max_length=50, blank=True, verbose_name='Телефон')
    email = models.EmailField(blank=True, verbose_name='Email')
    notes = models.TextField(blank=True, verbose_name='Заметки')
    is_regular = models.BooleanField(default=False, verbose_name='Постоянный клиент')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')
    class Meta:
        verbose_name = 'Заказчик'
        verbose_name_plural = 'Заказчики'
        ordering = ['-created_at']
    def __str__(self):
        return self.name
    @property
    def total_orders(self):
        return self.orders.count()
    @property
    def total_income(self):
        res = self.orders.filter(status='completed').aggregate(t=Sum('price'))
        return float(res['t'] or 0)
    @property
    def active_orders(self):
        return self.orders.filter(status='in_progress').count()
