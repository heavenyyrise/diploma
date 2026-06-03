import { useState, useEffect } from 'react'
import { clients as clientsApi } from '../../api'
import { Field, inputStyle } from './index'

export default function ClientSelect({ value, onChange, extraOptions = [] }) {
  const [options, setOptions] = useState([])

  useEffect(() => {
    clientsApi.list().then(r => {
      const items = r.data.results || r.data
      setOptions(items)
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/57ceb7b4-465a-4cb5-97b8-f8cb49bcb906',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fefc84'},body:JSON.stringify({sessionId:'fefc84',location:'ClientSelect.jsx:load',message:'clients list loaded',data:{loadedCount:items.length,apiCount:r.data.count??null,selectedValue:value||null,selectedInList:!!(value&&items.some(c=>String(c.id)===String(value)))},timestamp:Date.now(),hypothesisId:'A,E'})}).catch(()=>{});
      // #endregion
    })
  }, [])

  useEffect(() => {
    if (!value || !options.length) return
    // #region agent log
    fetch('http://127.0.0.1:7391/ingest/57ceb7b4-465a-4cb5-97b8-f8cb49bcb906',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fefc84'},body:JSON.stringify({sessionId:'fefc84',location:'ClientSelect.jsx:selection',message:'client selection check',data:{selectedValue:value,selectedInList:options.some(c=>String(c.id)===String(value)),optionsCount:options.length},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  }, [value, options])

  const optionIds = new Set(options.map(c => String(c.id)))
  const merged = [
    ...extraOptions.filter(o => o.value && !optionIds.has(String(o.value))),
    ...options.map(c => ({ value: String(c.id), label: c.lead_source_name ? `${c.name} (${c.lead_source_name})` : c.name })),
  ]

  return (
    <Field label="Клиент">
      <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Без клиента</option>
        {merged.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}
