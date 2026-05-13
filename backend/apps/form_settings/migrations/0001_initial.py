from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [('services', '0001_initial')]
    operations = [
        migrations.CreateModel(
            name='FormSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='Оставить заявку', max_length=255, verbose_name='Заголовок формы')),
                ('subtitle', models.TextField(default='Заполните форму и я свяжусь с вами в ближайшее время, чтобы обсудить детали.', verbose_name='Подзаголовок')),
                ('button_text', models.CharField(default='Отправить заявку', max_length=100, verbose_name='Текст кнопки')),
                ('success_message', models.TextField(default='Спасибо за обращение. Я свяжусь с вами в ближайшее время по указанным контактам.', verbose_name='Сообщение после отправки')),
                ('show_email', models.BooleanField(default=True, verbose_name='Показывать Email')),
                ('show_budget', models.BooleanField(default=True, verbose_name='Показывать Бюджет')),
                ('show_deadline', models.BooleanField(default=True, verbose_name='Показывать Дедлайн')),
                ('show_description', models.BooleanField(default=True, verbose_name='Показывать Описание задачи')),
                ('show_service', models.BooleanField(default=True, verbose_name='Показывать выбор услуги')),
                ('show_lead_source', models.BooleanField(default=True, verbose_name='Показывать источник')),
                ('services', models.ManyToManyField(blank=True, to='services.service', verbose_name='Услуги в форме')),
            ],
            options={'verbose_name': 'Настройки формы', 'verbose_name_plural': 'Настройки формы'},
        ),
    ]
