function toDateOnly(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function isRetrospectiveDeadline(deadline, createdAt) {
  const deadlineDate = toDateOnly(deadline)
  if (!deadlineDate) return false
  const ref = toDateOnly(createdAt) || toDateOnly(new Date())
  return deadlineDate < ref
}

export function getStatusDeadlineError(status, deadline, createdAt) {
  if (isRetrospectiveDeadline(deadline, createdAt) && status !== 'completed') {
    return 'Дедлайн раньше даты создания — выберите статус «Завершён»'
  }
  return null
}
