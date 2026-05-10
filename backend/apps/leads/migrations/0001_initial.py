import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = [('services', '0001_initial')]
    operations = [
        migrations.CreateModel(
            name='Lead',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Имя')),
                ('contact', models.CharField(max_length=500, verbose_name='Контакты для связи')),
                ('email', models.EmailField(blank=True, verbose_name='Email')),
                ('description', models.TextField(blank=True, verbose_name='Описание задачи')),
                ('budget', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Бюджет')),
                ('deadline', models.DateField(blank=True, null=True, verbose_name='Желаемый дедлайн')),
                ('status', models.CharField(choices=[('new','Новая'),('accepted','Принята'),('rejected','Отклонена')], default='new', max_length=20, verbose_name='Статус')),
                ('notes', models.TextField(blank=True, verbose_name='Мои заметки')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата заявки')),
                ('service', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='leads', to='services.service', verbose_name='Услуга')),
            ],
            options={'verbose_name':'Заявка','verbose_name_plural':'Заявки','ordering':['-created_at']},
        ),
    ]
