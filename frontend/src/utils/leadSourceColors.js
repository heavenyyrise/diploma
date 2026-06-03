// Палитра с разнесёнными оттенками — без пары похожих зелёных/синих подряд
const PALETTE = {
  blue: '#4a7fb5',
  terracotta: '#c17b5c',
  purple: '#8b6bb8',
  rose: '#d4537a',
  amber: '#c9a227',
  teal: '#5a9494',
  green: '#528f52',
  indigo: '#5c6bc0',
  slate: '#7a8a9a',
  neutral: '#a8a29e',
}

const LEAD_SOURCE_COLORS = {
  instagram:          PALETTE.rose,
  telegram:           PALETTE.blue,
  'вконтакте':        PALETTE.indigo,
  vk:                 PALETTE.indigo,
  'реклама':          PALETTE.terracotta,
  'рекомендация':     PALETTE.purple,
  'повторный клиент': PALETTE.teal,
  'без источника':    PALETTE.neutral,
  'новые клиенты':    PALETTE.green,
  'повторные':        PALETTE.blue,
  'без клиента':      PALETTE.neutral,
}

const FALLBACK_PALETTE = [
  PALETTE.blue,
  PALETTE.terracotta,
  PALETTE.purple,
  PALETTE.rose,
  PALETTE.amber,
  PALETTE.teal,
  PALETTE.green,
  PALETTE.indigo,
  PALETTE.slate,
]

function colorByName(label, map = {}) {
  const key = (label || '').trim().toLowerCase()
  if (map[key]) return map[key]
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % FALLBACK_PALETTE.length
  return FALLBACK_PALETTE[hash]
}

export function getLeadSourceColor(label) {
  return colorByName(label, LEAD_SOURCE_COLORS)
}

export function getServiceColor(name) {
  return colorByName(name, { 'без услуги': PALETTE.neutral })
}
