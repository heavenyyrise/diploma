import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('clients', '0001_initial'),
        ('services', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='Название заказа')),
                ('description', models.TextField(blank=True, verbose_name='ТЗ / Описание')),
                ('platform', models.CharField(choices=[('instagram','Instagram'),('telegram','Telegram'),('kwork','Kwork'),('other','Другое')], default='other', max_length=50, verbose_name='Площадка')),
                ('status', models.CharField(choices=[('in_progress','В разработке'),('completed','Завершён'),('frozen','Заморожен'),('cancelled','Отменён')], default='in_progress', max_length=50, verbose_name='Статус')),
                ('source', models.CharField(choices=[('manual','Вручную'),('telegram_bot','Telegram Бот')], default='manual', max_length=50, verbose_name='Источник')),
                ('price', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Сумма')),
                ('deadline', models.DateField(blank=True, null=True, verbose_name='Дедлайн')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создан')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлён')),
                ('completed_at', models.DateTimeField(blank=True, null=True, verbose_name='Завершён')),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to='clients.client', verbose_name='Заказчик')),
                ('services', models.ManyToManyField(blank=True, related_name='orders', to='services.service', verbose_name='Услуги')),
            ],
            options={'verbose_name':'Заказ','verbose_name_plural':'Заказы','ordering':['-created_at']},
        ),
    ]
