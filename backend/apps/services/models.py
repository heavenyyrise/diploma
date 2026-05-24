from django.db import models

class Service(models.Model):
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='services', verbose_name='Пользователь',
        null=True, blank=True,
    )
    name = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Базовая цена')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')
    class Meta:
        verbose_name = 'Услуга'
        verbose_name_plural = 'Услуги'
        ordering = ['name']
    def __str__(self):
        return self.name
    @property
    def active_orders_count(self):
        return self.orders.filter(status='in_progress').count()
    @property
    def total_orders_count(self):
        return self.orders.count()
