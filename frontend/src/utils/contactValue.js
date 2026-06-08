const TG_USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/
const IG_USERNAME_RE = /^(?!.*\.\.)(?!.*\.$)(?!^\.)([a-zA-Z0-9._]{1,30})$/
const VK_USERNAME_RE = /^[a-zA-Z0-9_.]{3,32}$/
const VK_ID_RE = /^id\d+$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DOMAIN_WHITELIST = {
  telegram: new Set(['t.me', 'telegram.me', 'telegram.dog']),
  instagram: new Set(['instagram.com', 'www.instagram.com']),
  vk: new Set(['vk.com', 'm.vk.com', 'vkontakte.ru', 'www.vk.com']),
}

export function getContactKind(typeName) {
  if (!typeName) return 'unknown'
  const normalized = typeName.trim().toLowerCase()
  if (['telegram', 'телеграм', 'телеграмм'].includes(normalized)) return 'telegram'
  if (['instagram', 'инстаграм', 'инстаграмм'].includes(normalized)) return 'instagram'
  if (['vk', 'vkontakte', 'вконтакте', 'вк'].includes(normalized)) return 'vk'
  if (normalized === 'email') return 'email'
  return 'unknown'
}

function looksLikeUrl(value) {
  const lowered = value.trim().toLowerCase()
  if (lowered.startsWith('http://') || lowered.startsWith('https://')) return true
  return /^[\w.-]+\.[a-z]{2,}(?:\/|$)/.test(lowered)
}

function parseHostAndPath(value) {
  const raw = value.trim()
  if (raw.toLowerCase().startsWith('http://') || raw.toLowerCase().startsWith('https://')) {
    try {
      const parsed = new URL(raw)
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
      const path = parsed.pathname.replace(/^\/+|\/+$/g, '')
      return [host, path]
    } catch {
      return [null, null]
    }
  }

  const lowered = raw.toLowerCase()
  if (lowered.includes('/')) {
    const [hostPart, ...rest] = lowered.split('/')
    return [hostPart.replace(/^www\./, ''), rest.join('/').replace(/^\/+|\/+$/g, '')]
  }
  return [null, null]
}

function wrongDomainError(kind) {
  const labels = { telegram: 'Telegram', instagram: 'Instagram', vk: 'ВКонтакте' }
  return `Эта ссылка не подходит для ${labels[kind]}.`
}

function formatError(kind) {
  const labels = {
    telegram: 'Укажите @username, ссылку t.me/... или номер телефона',
    instagram: 'Укажите ник Instagram (@username или username)',
    vk: 'Укажите @username, id123456 или ссылку vk.com/...',
    email: 'Укажите корректный email',
  }
  return labels[kind] || 'Некорректное значение контакта'
}

function extractRawValue(value, kind) {
  const trimmed = value.trim()
  if (!looksLikeUrl(trimmed)) return trimmed.replace(/^@+/, '')

  const [host, path] = parseHostAndPath(trimmed)
  if (!host) return trimmed.replace(/^@+/, '')

  const allowed = DOMAIN_WHITELIST[kind]
  if (!allowed?.has(host)) return null

  if (!path) return null
  const segment = path.split('/')[0].split('?')[0]
  return segment ? segment.replace(/^@+/, '') : null
}

function isPhone(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return false
  return /^[\d\s+\-().]+$/.test(value.trim())
}

function normalizePhone(value) {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }
  return `+${digits}`
}

function validateTelegram(value) {
  const trimmed = value.trim()
  if (looksLikeUrl(trimmed)) {
    const [host] = parseHostAndPath(trimmed)
    if (host && !DOMAIN_WHITELIST.telegram.has(host)) return wrongDomainError('telegram')
    const raw = extractRawValue(trimmed, 'telegram')
    if (raw && TG_USERNAME_RE.test(raw)) return null
    return formatError('telegram')
  }

  if (trimmed.startsWith('@') || /[a-zA-Z_]/.test(trimmed)) {
    const raw = trimmed.replace(/^@+/, '')
    if (TG_USERNAME_RE.test(raw)) return null
    return formatError('telegram')
  }

  if (isPhone(trimmed)) return null
  return formatError('telegram')
}

function validateInstagram(value) {
  const trimmed = value.trim()
  let raw
  if (looksLikeUrl(trimmed)) {
    const [host] = parseHostAndPath(trimmed)
    if (host && !DOMAIN_WHITELIST.instagram.has(host)) return wrongDomainError('instagram')
    raw = extractRawValue(trimmed, 'instagram')
  } else {
    raw = trimmed.replace(/^@+/, '')
  }
  if (raw && IG_USERNAME_RE.test(raw)) return null
  return formatError('instagram')
}

function validateVk(value) {
  const trimmed = value.trim()
  let raw
  if (looksLikeUrl(trimmed)) {
    const [host] = parseHostAndPath(trimmed)
    if (host && !DOMAIN_WHITELIST.vk.has(host)) return wrongDomainError('vk')
    raw = extractRawValue(trimmed, 'vk')
  } else {
    raw = trimmed.replace(/^@+/, '')
  }
  if (!raw) return formatError('vk')
  if (VK_ID_RE.test(raw) || VK_USERNAME_RE.test(raw)) return null
  return formatError('vk')
}

function validateEmail(value) {
  const trimmed = value.trim()
  if (looksLikeUrl(trimmed)) return formatError('email')
  if (EMAIL_RE.test(trimmed)) return null
  return formatError('email')
}

export function getContactValueError(value, typeName) {
  const trimmed = (value || '').trim()
  if (!trimmed) return null
  if (trimmed.length > 500) return 'Значение контакта не может быть длиннее 500 символов.'

  const kind = getContactKind(typeName)
  if (kind === 'telegram') return validateTelegram(trimmed)
  if (kind === 'instagram') return validateInstagram(trimmed)
  if (kind === 'vk') return validateVk(trimmed)
  if (kind === 'email') return validateEmail(trimmed)
  return null
}

export function normalizeContactValue(value, typeName) {
  const trimmed = (value || '').trim()
  if (!trimmed) return trimmed

  const kind = getContactKind(typeName)
  if (kind === 'unknown') return trimmed

  if (kind === 'email') return trimmed.toLowerCase()

  if (kind === 'telegram') {
    if (looksLikeUrl(trimmed)) {
      const [host] = parseHostAndPath(trimmed)
      if (DOMAIN_WHITELIST.telegram.has(host)) {
        const raw = extractRawValue(trimmed, 'telegram')
        if (raw && TG_USERNAME_RE.test(raw)) return `@${raw}`
      }
    }
    if (isPhone(trimmed)) return normalizePhone(trimmed)
    const raw = trimmed.replace(/^@+/, '')
    if (TG_USERNAME_RE.test(raw)) return `@${raw}`
    return trimmed
  }

  if (kind === 'instagram') {
    const raw = looksLikeUrl(trimmed)
      ? extractRawValue(trimmed, 'instagram')
      : trimmed.replace(/^@+/, '')
    if (raw && IG_USERNAME_RE.test(raw)) return `@${raw}`
    return trimmed
  }

  if (kind === 'vk') {
    const raw = looksLikeUrl(trimmed)
      ? extractRawValue(trimmed, 'vk')
      : trimmed.replace(/^@+/, '')
    if (raw) {
      if (VK_ID_RE.test(raw)) return raw.toLowerCase()
      if (VK_USERNAME_RE.test(raw)) return `@${raw}`
    }
    return trimmed
  }

  return trimmed
}

export function getContactPlaceholder(typeName) {
  const kind = getContactKind(typeName)
  if (kind === 'telegram') return 'Введите юзернейм либо номер телефона'
  if (kind === 'instagram') return 'Введите юзернейм'
  if (kind === 'vk') return 'Введите юзернейм'
  if (kind === 'email') return 'email@example.com'
  if (typeName?.trim()) return `Ваш ${typeName.trim()}`
  return 'Значение контакта'
}

export function getContactTypeName(contactTypes, contactTypeId) {
  const type = contactTypes?.find(t => t.id === contactTypeId)
  return type?.name || ''
}

export function hasContactErrors(contacts, contactTypes) {
  return (contacts || []).some(c => {
    if (!c.value?.trim()) return false
    const typeName = getContactTypeName(contactTypes, c.contact_type)
    return !!getContactValueError(c.value, typeName)
  })
}

export function normalizeContacts(contacts, contactTypes) {
  return (contacts || []).map(c => {
    if (!c.value?.trim()) return c
    const typeName = getContactTypeName(contactTypes, c.contact_type)
    return { ...c, value: normalizeContactValue(c.value, typeName) }
  })
}
