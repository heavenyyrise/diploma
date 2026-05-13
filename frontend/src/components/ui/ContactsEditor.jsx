import { inputStyle, Button } from './index.jsx'

export default function ContactsEditor({ contacts, contactTypes, onChange }) {
  const addContact = () => {
    const firstType = contactTypes[0]
    if (!firstType) return
    onChange([...contacts, { contact_type: firstType.id, value: '' }])
  }

  const updateContact = (idx, field, val) => {
    const updated = contacts.map((c, i) => i === idx ? { ...c, [field]: val } : c)
    onChange(updated)
  }

  const removeContact = idx => {
    onChange(contacts.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {contacts.map((c, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={c.contact_type}
            onChange={e => updateContact(idx, 'contact_type', Number(e.target.value))}
            style={{ ...inputStyle, width: 130, flexShrink: 0 }}
          >
            {contactTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            value={c.value}
            onChange={e => updateContact(idx, 'value', e.target.value)}
            placeholder="Значение контакта"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => removeContact(idx)}
            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, padding: '0 4px' }}
          >×</button>
        </div>
      ))}
      {contactTypes.length > 0 && (
        <button
          type="button"
          onClick={addContact}
          style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
        >
          + Добавить контакт
        </button>
      )}
    </div>
  )
}
