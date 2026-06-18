import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0005_migrate_dictionaries_to_users'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='leadsource',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='lead_sources',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Пользователь',
            ),
        ),
        migrations.AlterField(
            model_name='contacttype',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='contact_types',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Пользователь',
            ),
        ),
        migrations.AddConstraint(
            model_name='leadsource',
            constraint=models.UniqueConstraint(fields=('user', 'name'), name='unique_lead_source_per_user'),
        ),
        migrations.AddConstraint(
            model_name='contacttype',
            constraint=models.UniqueConstraint(fields=('user', 'name'), name='unique_contact_type_per_user'),
        ),
    ]
