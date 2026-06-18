import { useState } from 'react'
import AuthenticatedImage from '../ui/AuthenticatedImage'
import { downloadAuthenticatedFile } from '../../utils/authenticatedFile'

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function OrderFilesSection({
  title,
  hint,
  inputId,
  items,
  uploading,
  uploadError,
  onUpload,
  onDelete,
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = e => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  const handleFileInput = e => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  return (
    <div>
      <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {title}
      </h3>
      {hint && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>{hint}</p>
      )}
      {!hint && <div style={{ marginBottom: 16 }} />}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '20px 16px',
          textAlign: 'center',
          background: dragOver ? 'var(--accent-light)' : 'var(--bg)',
          marginBottom: 16,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <input
          type="file"
          id={inputId}
          accept=".jpg,.jpeg,.png,.pdf,.docx,.zip"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <label htmlFor={inputId} style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
            {uploading ? 'Загрузка...' : 'Перетащите файл сюда или нажмите для выбора'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>JPG, PNG, PDF, DOCX, ZIP · до 10 МБ</div>
        </label>
      </div>
      {uploadError && (
        <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginBottom: 12 }}>{uploadError}</div>
      )}
      {items.length === 0
        ? <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Файлов пока нет</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                {a.is_image
                  ? (
                    <AuthenticatedImage
                      fileUrl={a.file_url}
                      alt={a.original_name}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  )
                  : (
                    <div style={{ width: 56, height: 56, borderRadius: 6, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.4rem' }}>📄</div>
                  )
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => downloadAuthenticatedFile(a.file_url, a.original_name)}
                    style={{
                      fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none',
                      wordBreak: 'break-word', display: 'block', background: 'none', border: 'none',
                      padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                    }}
                  >
                    {a.original_name}
                  </button>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatFileSize(a.file_size)} · {formatDateTime(a.uploaded_at)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px', flexShrink: 0 }}
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
