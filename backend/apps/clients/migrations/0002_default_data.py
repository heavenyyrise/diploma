from django.db import migrations


def create_defaults(apps, schema_editor):
    LeadSource = apps.get_model('clients', 'LeadSource')
    ContactType = apps.get_model('clients', 'ContactType')

    lead_sources = [
        'Instagram',
        'Telegram',
        'Реклама',
        'Рекомендация',
        'Повторный клиент',
    ]
    for i, name in enumerate(lead_sources):
        LeadSource.objects.create(name=name, order=i)

    contact_types = [
        'Telegram',
        'Instagram',
        'ВКонтакте',
        'Email',
    ]
    for i, name in enumerate(contact_types):
        ContactType.objects.create(name=name, order=i)


class Migration(migrations.Migration):
    dependencies = [
        ('clients', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(create_defaults, migrations.RunPython.noop),
    ]
