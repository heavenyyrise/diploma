from django.db import models
from django.db.models import Sum


class LeadSource(models.Model):
    """Источник клиента (откуда узнал о фрилансере)"""
    name = models.CharField(max_length=255, verbose_name='Название')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Источник клиента'
        verbose_name_plural = 'Источники клиентов'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class ContactType(models.Model):
    """Тип контакта (Telegram, Instagram, Email и т.д.)"""
    name = models.CharField(max_length=100, verbose_name='Название')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Тип контакта'
        verbose_name_plural = 'Типы контактов'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Client(models.Model):
    user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        related_name='clients', verbose_name='Пользователь',
        null=True, blank=True,
    )
    name = models.CharField(max_length=255, verbose_name='Имя')
    lead_source = models.ForeignKey(
        LeadSource, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='clients', verbose_name='Источник'
    )
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

    @property
    def primary_contact(self):
        """Первый контакт для отображения в списке"""
        c = self.contacts.first()
        if c:
            return f"{c.contact_type.name}: {c.value}"
        return ''


class ContactInfo(models.Model):
    """Контакт для связи с клиентом"""
    client = models.ForeignKey(
        Client, on_delete=models.CASCADE,
        related_name='contacts', verbose_name='Клиент'
    )
    contact_type = models.ForeignKey(
        ContactType, on_delete=models.PROTECT,
        verbose_name='Тип контакта'
    )
    value = models.CharField(max_length=500, verbose_name='Значение')

    class Meta:
        verbose_name = 'Контакт'
        verbose_name_plural = 'Контакты'
        ordering = ['contact_type__order', 'id']

    def __str__(self):
        return f"{self.contact_type.name}: {self.value}"
