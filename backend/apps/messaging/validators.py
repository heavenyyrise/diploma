import os

ALLOWED_ATTACHMENT_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf', '.docx', '.zip'}
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.zip': 'application/zip',
}


MAX_EMAIL_ATTACHMENTS = 5


def validate_attachment(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_ATTACHMENT_EXTENSIONS:
        raise ValueError('Допустимые форматы вложений: JPG, PNG, PDF, DOCX, ZIP.')
    if file.size > MAX_ATTACHMENT_SIZE:
        raise ValueError('Максимальный размер файла — 10 МБ.')
    return {
        'filename': file.name,
        'content': file.read(),
        'mimetype': MIME_TYPES.get(ext, 'application/octet-stream'),
    }


def attachment_from_order_file(original_name, file_field):
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_ATTACHMENT_EXTENSIONS:
        raise ValueError(f'Файл «{original_name}»: допустимые форматы JPG, PNG, PDF, DOCX, ZIP.')
    file_field.open('rb')
    try:
        content = file_field.read()
    finally:
        file_field.close()
    if len(content) > MAX_ATTACHMENT_SIZE:
        raise ValueError(f'Файл «{original_name}»: максимальный размер — 10 МБ.')
    return {
        'filename': original_name,
        'content': content,
        'mimetype': MIME_TYPES.get(ext, 'application/octet-stream'),
    }
