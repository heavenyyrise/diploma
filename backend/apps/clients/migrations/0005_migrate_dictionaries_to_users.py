from django.db import migrations


DEFAULT_LEAD_SOURCES = [
    'Instagram',
    'Telegram',
    'Реклама',
    'Рекомендация',
    'Повторный клиент',
]

DEFAULT_CONTACT_TYPES = [
    'Telegram',
    'Instagram',
    'ВКонтакте',
    'Email',
]


def _seed_defaults(model, names, user):
    for i, name in enumerate(names):
        model.objects.get_or_create(
            user=user,
            name=name,
            defaults={'order': i},
        )


def _build_or_clone_mapping(model, global_records, user):
    mapping = {}
    for record in global_records:
        clone, _ = model.objects.get_or_create(
            user=user,
            name=record.name,
            defaults={'is_active': record.is_active, 'order': record.order},
        )
        mapping[record.pk] = clone.pk
    return mapping


def migrate_to_user_scoped(apps, schema_editor):
    User = apps.get_model('users', 'User')
    LeadSource = apps.get_model('clients', 'LeadSource')
    ContactType = apps.get_model('clients', 'ContactType')
    Client = apps.get_model('clients', 'Client')
    ContactInfo = apps.get_model('clients', 'ContactInfo')
    Lead = apps.get_model('leads', 'Lead')

    users = list(User.objects.order_by('id'))
    global_lead_sources = list(LeadSource.objects.filter(user__isnull=True))
    global_contact_types = list(ContactType.objects.filter(user__isnull=True))

    if not users:
        LeadSource.objects.filter(user__isnull=True).delete()
        ContactType.objects.filter(user__isnull=True).delete()
        return

    fallback_user = users[0]
    Client.objects.filter(user__isnull=True).update(user_id=fallback_user.id)
    Lead.objects.filter(user__isnull=True).update(user_id=fallback_user.id)

    user_maps = {}
    for user in users:
        if global_lead_sources:
            ls_map = _build_or_clone_mapping(LeadSource, global_lead_sources, user)
        else:
            ls_map = {}
            if not LeadSource.objects.filter(user=user).exists():
                _seed_defaults(LeadSource, DEFAULT_LEAD_SOURCES, user)

        if global_contact_types:
            ct_map = _build_or_clone_mapping(ContactType, global_contact_types, user)
        else:
            ct_map = {}
            if not ContactType.objects.filter(user=user).exists():
                _seed_defaults(ContactType, DEFAULT_CONTACT_TYPES, user)

        user_maps[user.id] = {'lead_source': ls_map, 'contact_type': ct_map}

    for client in Client.objects.exclude(lead_source__isnull=True):
        ls_map = user_maps.get(client.user_id, {}).get('lead_source', {})
        old_id = client.lead_source_id
        if old_id in ls_map:
            client.lead_source_id = ls_map[old_id]
            client.save(update_fields=['lead_source_id'])

    for contact in ContactInfo.objects.select_related('client').all():
        ct_map = user_maps.get(contact.client.user_id, {}).get('contact_type', {})
        old_id = contact.contact_type_id
        if old_id in ct_map:
            contact.contact_type_id = ct_map[old_id]
            contact.save(update_fields=['contact_type_id'])

    for lead in Lead.objects.all():
        maps = user_maps.get(lead.user_id, {})
        ls_map = maps.get('lead_source', {})
        ct_map = maps.get('contact_type', {})
        update_fields = []
        if lead.lead_source_id and lead.lead_source_id in ls_map:
            lead.lead_source_id = ls_map[lead.lead_source_id]
            update_fields.append('lead_source_id')
        if lead.contact_type_id and lead.contact_type_id in ct_map:
            lead.contact_type_id = ct_map[lead.contact_type_id]
            update_fields.append('contact_type_id')
        if update_fields:
            lead.save(update_fields=update_fields)

    for user in users:
        if not LeadSource.objects.filter(user=user).exists():
            _seed_defaults(LeadSource, DEFAULT_LEAD_SOURCES, user)
        if not ContactType.objects.filter(user=user).exists():
            _seed_defaults(ContactType, DEFAULT_CONTACT_TYPES, user)

    if global_lead_sources:
        LeadSource.objects.filter(user__isnull=True).delete()
    if global_contact_types:
        ContactType.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0004_leadsource_contacttype_user_nullable'),
        ('leads', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_to_user_scoped, migrations.RunPython.noop),
    ]
