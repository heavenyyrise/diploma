from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_fix_completed_at_from_deadline'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderattachment',
            name='kind',
            field=models.CharField(
                choices=[('document', 'Документ'), ('deliverable', 'Финальный')],
                default='document',
                max_length=20,
                verbose_name='Тип',
            ),
        ),
    ]
