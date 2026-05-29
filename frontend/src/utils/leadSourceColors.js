// Базовые цвета с дашборда (--info, --success) и приглушённые производные
const INFO = '#4a7fb5'
const SUCCESS = '#65a165'
const INFO_LIGHT = '#6a94bc'
const INFO_DARK = '#3d6d9e'
const SUCCESS_LIGHT = '#7aad7a'
const SUCCESS_DARK = '#528f52'
const TEAL = '#5a9494'
const ACCENT = '#c17b5c'
const NEUTRAL = '#a8a29e'

const LEAD_SOURCE_COLORS = {
  instagram:          SUCCESS,
  telegram:           INFO,
  'вконтакте':        INFO_DARK,
  vk:                 INFO_DARK,
  'реклама':          ACCENT,
  'рекомендация':     SUCCESS_LIGHT,
  'повторный клиент': SUCCESS_DARK,
  'без источника':    NEUTRAL,
}

const FALLBACK_PALETTE = [
  INFO, SUCCESS, TEAL, INFO_LIGHT, SUCCESS_LIGHT, ACCENT, INFO_DARK, SUCCESS_DARK,
]

function colorByName(label, map = {}) {
  const key = (label || '').trim().toLowerCase()
  if (map[key]) return map[key]
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i)) % FALLBACK_PALETTE.length
  return FALLBACK_PALETTE[hash]
}

export function getLeadSourceColor(label) {
  return colorByName(label, LEAD_SOURCE_COLORS)
}

export function getServiceColor(name) {
  return colorByName(name, { 'без услуги': NEUTRAL })
}
