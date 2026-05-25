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
