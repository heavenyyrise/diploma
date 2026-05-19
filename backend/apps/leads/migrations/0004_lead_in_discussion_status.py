from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
    ('leads', '0003_merge_leads'),
]
    operations = [
        migrations.AlterField(
            model_name='lead',
            name='status',
            field=models.CharField(
                choices=[
                    ('new', 'Новая'),
                    ('in_discussion', 'В обсуждении'),
                    ('accepted', 'Принята'),
                    ('rejected', 'Отклонена'),
                ],
                default='new',
                max_length=20,
                verbose_name='Статус',
            ),
        ),
    ]
