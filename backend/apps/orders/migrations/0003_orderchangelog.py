import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_order_user'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderChangeLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('field', models.CharField(choices=[('created', 'Создание'), ('price', 'Сумма'), ('status', 'Статус'), ('title', 'Название'), ('description', 'Описание'), ('deadline', 'Дедлайн'), ('client', 'Клиент'), ('services', 'Услуги')], max_length=50, verbose_name='Поле')),
                ('old_value', models.TextField(blank=True, verbose_name='Было')),
                ('new_value', models.TextField(blank=True, verbose_name='Стало')),
                ('changed_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата изменения')),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_changes', to=settings.AUTH_USER_MODEL, verbose_name='Изменил')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='change_logs', to='orders.order', verbose_name='Заказ')),
            ],
            options={
                'verbose_name': 'Изменение заказа',
                'verbose_name_plural': 'Изменения заказов',
                'ordering': ['-changed_at'],
            },
        ),
    ]
