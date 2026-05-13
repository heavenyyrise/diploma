from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='LeadSource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Название')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
            ],
            options={'verbose_name': 'Источник клиента', 'verbose_name_plural': 'Источники клиентов', 'ordering': ['order', 'name']},
        ),
        migrations.CreateModel(
            name='ContactType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Название')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
            ],
            options={'verbose_name': 'Тип контакта', 'verbose_name_plural': 'Типы контактов', 'ordering': ['order', 'name']},
        ),
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Имя')),
                ('notes', models.TextField(blank=True, verbose_name='Заметки')),
                ('is_regular', models.BooleanField(default=False, verbose_name='Постоянный клиент')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')),
                ('lead_source', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='clients', to='clients.leadsource', verbose_name='Источник')),
            ],
            options={'verbose_name': 'Заказчик', 'verbose_name_plural': 'Заказчики', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='ContactInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=500, verbose_name='Значение')),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contacts', to='clients.client', verbose_name='Клиент')),
                ('contact_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='clients.contacttype', verbose_name='Тип контакта')),
            ],
            options={'verbose_name': 'Контакт', 'verbose_name_plural': 'Контакты', 'ordering': ['contact_type__order', 'id']},
        ),
    ]
