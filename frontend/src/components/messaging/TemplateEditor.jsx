import { Button, Field, inputStyle } from '../ui'

const PLACEHOLDERS = '{client_name}, {order_title}, {order_price}, {order_status}, {deadline}'

export default function TemplateEditor({ template, onChange, onSave, onDelete, saving, isNew }) {
  if (!template) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Выберите шаблон или создайте новый
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 500, marginBottom: 20 }}>
        {isNew ? 'Новый шаблон' : 'Редактирование шаблона'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <Field label="Название" required>
          <input value={template.name} onChange={e => onChange({ ...template, name: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Тема">
          <input value={template.subject} onChange={e => onChange({ ...template, subject: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Текст">
          <textarea
            value={template.body}
            onChange={e => onChange({ ...template, body: e.target.value })}
            style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }}
          />
        </Field>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Плейсхолдеры: {PLACEHOLDERS}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {!isNew && (
          <Button variant="danger" onClick={onDelete}>Удалить</Button>
        )}
        <div style={{ flex: 1 }} />
        <Button onClick={onSave} disabled={saving || !template.name?.trim()}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}
