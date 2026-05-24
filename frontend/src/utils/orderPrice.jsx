import { formatMoney } from '../components/ui'

export function calcServicesPrice(selectedIds, servicesList) {
  if (!selectedIds?.length || !servicesList?.length) return 0
  return servicesList
    .filter(s => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
}

export function applyServiceToggle(form, serviceId, servicesList, priceManuallyEdited) {
  const services = form.services.includes(serviceId)
    ? form.services.filter(id => id !== serviceId)
    : [...form.services, serviceId]
  const next = { ...form, services }
  if (!priceManuallyEdited) {
    const total = calcServicesPrice(services, servicesList)
    next.price = services.length ? total : ''
  }
  return next
}

export function PriceAutoHint({ selectedIds, servicesList, manual }) {
  if (manual || !selectedIds?.length) return null
  return (
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
      Автоматически: {formatMoney(calcServicesPrice(selectedIds, servicesList))}
    </p>
  )
}
