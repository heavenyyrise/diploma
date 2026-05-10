from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Имя')),
                ('username', models.CharField(blank=True, max_length=255, verbose_name='Никнейм')),
                ('platform', models.CharField(choices=[('instagram','Instagram'),('telegram','Telegram'),('kwork','Kwork'),('other','Другое')], default='other', max_length=50, verbose_name='Площадка')),
                ('phone', models.CharField(blank=True, max_length=50, verbose_name='Телефон')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='Email')),
                ('notes', models.TextField(blank=True, verbose_name='Заметки')),
                ('is_regular', models.BooleanField(default=False, verbose_name='Постоянный клиент')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')),
            ],
            options={'verbose_name':'Заказчик','verbose_name_plural':'Заказчики','ordering':['-created_at']},
        ),
    ]
