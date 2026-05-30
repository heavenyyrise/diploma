import { useState, useEffect } from 'react'
import { clients as clientsApi } from '../../api'
import { Field, inputStyle } from './index'

export default function ClientSelect({ value, onChange, extraOptions = [] }) {
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = search.trim() ? { search: search.trim() } : {}
      clientsApi.list(params).then(r => setOptions(r.data.results || r.data))
    }, search.trim() ? 250 : 0)
    return () => clearTimeout(timer)
  }, [search])

  const optionIds = new Set(options.map(c => String(c.id)))
  const merged = [
    ...extraOptions.filter(o => o.value && !optionIds.has(String(o.value))),
    ...options.map(c => ({ value: String(c.id), label: c.lead_source_name ? `${c.name} (${c.lead_source_name})` : c.name })),
  ]

  return (
    <Field label="Клиент">
      <input
        style={{ ...inputStyle, marginBottom: 8 }}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по имени..."
      />
      <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Без клиента</option>
        {merged.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}
