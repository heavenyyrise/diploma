import re
from urllib.parse import urlparse

from django.core.validators import EmailValidator

CLIENT_NAME_RE = re.compile(r'^[a-zA-Zа-яА-ЯёЁ\s()]+$')

TG_USERNAME_RE = re.compile(r'^[a-zA-Z][a-zA-Z0-9_]{4,31}$')
IG_USERNAME_RE = re.compile(r'^(?!.*\.\.)(?!.*\.$)(?!^\.)[a-zA-Z0-9._]{1,30}$')
VK_USERNAME_RE = re.compile(r'^[a-zA-Z0-9_.]{3,32}$')
VK_ID_RE = re.compile(r'^id\d+$', re.IGNORECASE)

DOMAIN_WHITELIST = {
    'telegram': {'t.me', 'telegram.me', 'telegram.dog'},
    'instagram': {'instagram.com', 'www.instagram.com'},
    'vk': {'vk.com', 'm.vk.com', 'vkontakte.ru', 'www.vk.com'},
}

EMAIL_VALIDATOR = EmailValidator()


def validate_name_field(name, field_label='Имя'):
    if not CLIENT_NAME_RE.fullmatch(name.strip()):
        return f'{field_label} может содержать только буквы, пробелы и скобки.'
    return None


def validate_client_name(name):
    return validate_name_field(name, 'Имя')


def get_contact_kind(type_name):
    if not type_name:
        return 'unknown'
    normalized = type_name.strip().lower()
    if normalized in ('telegram', 'телеграм', 'телеграмм'):
        return 'telegram'
    if normalized in ('instagram', 'инстаграм', 'инстаграмм'):
        return 'instagram'
    if normalized in ('vk', 'vkontakte', 'вконтакте', 'вк'):
        return 'vk'
    if normalized == 'email':
        return 'email'
    return 'unknown'


def _looks_like_url(value):
    lowered = value.strip().lower()
    if lowered.startswith('http://') or lowered.startswith('https://'):
        return True
    return bool(re.match(r'^[\w.-]+\.[a-z]{2,}(?:/|$)', lowered))


def _parse_host_and_path(value):
    raw = value.strip()
    if raw.lower().startswith(('http://', 'https://')):
        parsed = urlparse(raw)
        host = (parsed.netloc or '').lower().removeprefix('www.')
        path = (parsed.path or '').strip('/')
        return host, path

    lowered = raw.lower()
    if '/' in lowered:
        host_part, path_part = lowered.split('/', 1)
        host = host_part.removeprefix('www.')
        return host, path_part.strip('/')
    return None, None


def _wrong_domain_error(kind):
    labels = {
        'telegram': 'Telegram',
        'instagram': 'Instagram',
        'vk': 'ВКонтакте',
    }
    return f'Эта ссылка не подходит для {labels[kind]}.'


def _format_error(kind):
    labels = {
        'telegram': 'Укажите @username, ссылку t.me/... или номер телефона',
        'instagram': 'Укажите ник Instagram (@username или username)',
        'vk': 'Укажите @username, id123456 или ссылку vk.com/...',
        'email': 'Укажите корректный email',
    }
    return labels.get(kind, 'Некорректное значение контакта')


def _extract_raw_value(value, kind):
    trimmed = value.strip()
    if not _looks_like_url(trimmed):
        return trimmed.lstrip('@')

    host, path = _parse_host_and_path(trimmed)
    if not host:
        return trimmed.lstrip('@')

    allowed = DOMAIN_WHITELIST.get(kind, set())
    if host not in allowed:
        return None

    if not path:
        return None

    segment = path.split('/')[0].split('?')[0]
    return segment.lstrip('@') if segment else None


def _is_phone(value):
    digits = re.sub(r'\D', '', value)
    if len(digits) < 10 or len(digits) > 15:
        return False
    return bool(re.fullmatch(r'[\d\s+\-().]+', value.strip()))


def _normalize_phone(value):
    digits = re.sub(r'\D', '', value)
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    return f'+{digits.lstrip("+")}'


def _validate_telegram(value):
    trimmed = value.strip()
    if _looks_like_url(trimmed):
        host, _ = _parse_host_and_path(trimmed)
        if host and host not in DOMAIN_WHITELIST['telegram']:
            return _wrong_domain_error('telegram')
        raw = _extract_raw_value(trimmed, 'telegram')
        if raw is None:
            return _format_error('telegram')
        if TG_USERNAME_RE.fullmatch(raw):
            return None
        return _format_error('telegram')

    if trimmed.startswith('@') or re.search(r'[a-zA-Z_]', trimmed):
        raw = trimmed.lstrip('@')
        if TG_USERNAME_RE.fullmatch(raw):
            return None
        return _format_error('telegram')

    if _is_phone(trimmed):
        return None

    return _format_error('telegram')


def _validate_instagram(value):
    trimmed = value.strip()
    if _looks_like_url(trimmed):
        host, _ = _parse_host_and_path(trimmed)
        if host and host not in DOMAIN_WHITELIST['instagram']:
            return _wrong_domain_error('instagram')
        raw = _extract_raw_value(trimmed, 'instagram')
    else:
        raw = trimmed.lstrip('@')

    if raw and IG_USERNAME_RE.fullmatch(raw):
        return None
    return _format_error('instagram')


def _validate_vk(value):
    trimmed = value.strip()
    if _looks_like_url(trimmed):
        host, _ = _parse_host_and_path(trimmed)
        if host and host not in DOMAIN_WHITELIST['vk']:
            return _wrong_domain_error('vk')
        raw = _extract_raw_value(trimmed, 'vk')
    else:
        raw = trimmed.lstrip('@')

    if not raw:
        return _format_error('vk')
    if VK_ID_RE.fullmatch(raw) or VK_USERNAME_RE.fullmatch(raw):
        return None
    return _format_error('vk')


def _validate_email(value):
    trimmed = value.strip()
    if _looks_like_url(trimmed):
        return _format_error('email')
    try:
        EMAIL_VALIDATOR(trimmed)
    except Exception:
        return _format_error('email')
    return None


def validate_contact_value(value, type_name):
    trimmed = (value or '').strip()
    if not trimmed:
        return None
    if len(trimmed) > 500:
        return 'Значение контакта не может быть длиннее 500 символов.'

    kind = get_contact_kind(type_name)
    if kind == 'telegram':
        return _validate_telegram(trimmed)
    if kind == 'instagram':
        return _validate_instagram(trimmed)
    if kind == 'vk':
        return _validate_vk(trimmed)
    if kind == 'email':
        return _validate_email(trimmed)
    return None


def normalize_contact_value(value, type_name):
    trimmed = (value or '').strip()
    if not trimmed:
        return trimmed

    kind = get_contact_kind(type_name)
    if kind == 'unknown':
        return trimmed

    if kind == 'email':
        return trimmed.lower()

    if kind == 'telegram':
        if _looks_like_url(trimmed):
            host, _ = _parse_host_and_path(trimmed)
            if host in DOMAIN_WHITELIST['telegram']:
                raw = _extract_raw_value(trimmed, 'telegram')
                if raw and TG_USERNAME_RE.fullmatch(raw):
                    return f'@{raw}'
        if _is_phone(trimmed):
            return _normalize_phone(trimmed)
        raw = trimmed.lstrip('@')
        if TG_USERNAME_RE.fullmatch(raw):
            return f'@{raw}'
        return trimmed

    if kind == 'instagram':
        raw = _extract_raw_value(trimmed, 'instagram') if _looks_like_url(trimmed) else trimmed.lstrip('@')
        if raw and IG_USERNAME_RE.fullmatch(raw):
            return f'@{raw}'
        return trimmed

    if kind == 'vk':
        raw = _extract_raw_value(trimmed, 'vk') if _looks_like_url(trimmed) else trimmed.lstrip('@')
        if raw:
            if VK_ID_RE.fullmatch(raw):
                return raw.lower()
            if VK_USERNAME_RE.fullmatch(raw):
                return f'@{raw}'
        return trimmed

    return trimmed
