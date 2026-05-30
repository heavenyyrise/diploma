const TECHNICAL_PATTERN = /Traceback|Error:|HTTP\s*\d|undefined|null|\[object|Invalid pk|does not exist|runserver|backend|Exception|SyntaxError|TypeError|KeyError/i

function isUserFriendly(msg) {
  if (!msg || typeof msg !== 'string') return false
  if (msg.length > 300) return false
  if (TECHNICAL_PATTERN.test(msg)) return false
  if (/^\{/.test(msg.trim())) return false
  return true
}

function pickString(value) {
  if (typeof value === 'string' && isUserFriendly(value)) return value
  if (Array.isArray(value) && typeof value[0] === 'string' && isUserFriendly(value[0])) return value[0]
  return null
}

export function getUserFacingError(err, fallback = 'Что-то пошло не так') {
  const data = err?.response?.data
  if (!data) return fallback

  for (const key of ['name', 'status', 'file', 'email', 'password', 'attachments', 'detail']) {
    const msg = pickString(data[key])
    if (msg) return msg
  }

  const nonField = pickString(data.non_field_errors)
  if (nonField) return nonField

  return fallback
}
