from django.db import models


class Lead(models.Model):
    STATUS_CHOICES = [
        ('new', 'Новая'),
        ('in_discussion', 'В обсуждении'),
        ('accepted', 'Принята'),
        ('rejected', 'Отклонена'),
    ]

    name = models.CharField(max_length=255, verbose_name='Имя')
    contact_type = models.ForeignKey(
        'clients.ContactType', on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='Тип контакта'
    )
    contact_value = models.CharField(max_length=500, blank=True, verbose_name='Контакт')
    email = models.EmailField(blank=True, verbose_name='Email')
    lead_source = models.ForeignKey(
        'clients.LeadSource', on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='Источник'
    )
    services = models.ManyToManyField(
        'services.Service', blank=True,
        related_name='leads', verbose_name='Услуги'
    )
    description = models.TextField(blank=True, verbose_name='Описание задачи')
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Бюджет')
    deadline = models.DateField(null=True, blank=True, verbose_name='Желаемый дедлайн')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name='Статус')
    notes = models.TextField(blank=True, verbose_name='Мои заметки')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата заявки')

    class Meta:
        verbose_name = 'Заявка'
        verbose_name_plural = 'Заявки'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.get_status_display()}'

    @property
    def contact_display(self):
        parts = []
        if self.contact_type and self.contact_value:
            parts.append(f"{self.contact_type.name}: {self.contact_value}")
        if self.email:
            parts.append(f"Email: {self.email}")
        return ', '.join(parts) if parts else '—'
