from django.db import models


class FormSettings(models.Model):
    title = models.CharField(max_length=255, default='Оставить заявку', verbose_name='Заголовок формы')
    subtitle = models.TextField(default='Заполните форму и я свяжусь с вами в ближайшее время, чтобы обсудить детали.', verbose_name='Подзаголовок')
    button_text = models.CharField(max_length=100, default='Отправить заявку', verbose_name='Текст кнопки')
    success_message = models.TextField(default='Спасибо за обращение. Я свяжусь с вами в ближайшее время по указанным контактам.', verbose_name='Сообщение после отправки')
    show_email = models.BooleanField(default=True, verbose_name='Показывать Email')
    show_budget = models.BooleanField(default=True, verbose_name='Показывать Бюджет')
    show_deadline = models.BooleanField(default=True, verbose_name='Показывать Дедлайн')
    show_description = models.BooleanField(default=True, verbose_name='Показывать Описание задачи')
    show_service = models.BooleanField(default=True, verbose_name='Показывать выбор услуги')
    services = models.ManyToManyField('services.Service', blank=True, verbose_name='Услуги в форме')

    class Meta:
        verbose_name = 'Настройки формы'
        verbose_name_plural = 'Настройки формы'

    def __str__(self):
        return 'Настройки публичной формы'

    @classmethod
    def get_instance(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
