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


def seed_user_dictionaries(user):
    from .models import ContactType, LeadSource

    for i, name in enumerate(DEFAULT_LEAD_SOURCES):
        LeadSource.objects.get_or_create(
            user=user,
            name=name,
            defaults={'order': i},
        )

    for i, name in enumerate(DEFAULT_CONTACT_TYPES):
        ContactType.objects.get_or_create(
            user=user,
            name=name,
            defaults={'order': i},
        )
