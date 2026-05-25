import re

CLIENT_NAME_RE = re.compile(r'^[a-zA-Zа-яА-ЯёЁ\s()]+$')


def validate_name_field(name, field_label='Имя'):
    if not CLIENT_NAME_RE.fullmatch(name.strip()):
        return f'{field_label} может содержать только буквы, пробелы и скобки.'
    return None


def validate_client_name(name):
    return validate_name_field(name, 'Имя')
