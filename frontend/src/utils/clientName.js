const CLIENT_NAME_RE = /^[a-zA-Zа-яА-ЯёЁ\s()]+$/

export function sanitizeClientName(value) {
  return value.replace(/[^a-zA-Zа-яА-ЯёЁ\s()]/g, '')
}

export function getClientNameError(name, fieldLabel = 'Имя') {
  const trimmed = name.trim()
  if (!trimmed) return null
  if (!CLIENT_NAME_RE.test(trimmed)) {
    return `${fieldLabel} может содержать только буквы, пробелы и скобки`
  }
  return null
}
