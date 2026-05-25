export function findClientEmail(contacts) {
  const emailContact = contacts?.find(c => c.contact_type_name === 'Email')
  return emailContact?.value || ''
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function extractClientEmail(client) {
  return findClientEmail(client?.contacts)
}

export function clientToRecipient(client) {
  return {
    clientId: client.id,
    name: client.name,
    email: extractClientEmail(client),
    initials: getInitials(client.name),
  }
}

export function formatEmailDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function formatEmailDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const EMPTY_RECIPIENT = { clientId: null, name: '', email: '', initials: '' }
