import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { auth, messaging as messagingApi } from '../api'
import { Button } from '../components/ui'
import EmailNavSidebar from '../components/messaging/EmailNavSidebar'
import ComposeEmailForm from '../components/messaging/ComposeEmailForm'
import SentEmailPreview from '../components/messaging/SentEmailPreview'
import TemplateEditor from '../components/messaging/TemplateEditor'
import { formatEmailDate, getInitials, EMPTY_RECIPIENT } from '../components/messaging/utils'

const EMPTY_TEMPLATE = { id: null, name: '', subject: '', body: '' }

export default function EmailPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('sent')
  const [replyTo, setReplyTo] = useState('')
  const [savingReply, setSavingReply] = useState(false)
  const [replySaved, setReplySaved] = useState(false)
  const [sentEmails, setSentEmails] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedEmailId, setSelectedEmailId] = useState(null)
  const [composeRecipient, setComposeRecipient] = useState(null)
  const [composeOrderId, setComposeOrderId] = useState(null)
  const [composeClientId, setComposeClientId] = useState(null)
  const [composeKey, setComposeKey] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateDraft, setTemplateDraft] = useState(null)
  const [savingTemplate, setSavingTemplate] = useState(false)

  const selectedEmail = sentEmails.find(e => e.id === selectedEmailId) || null

  const loadSent = useCallback(() => {
    messagingApi.sent().then(r => setSentEmails(r.data || [])).catch(() => setSentEmails([]))
  }, [])

  const loadTemplates = useCallback(() => {
    messagingApi.templates.list().then(r => setTemplates(r.data.results || r.data)).catch(() => setTemplates([]))
  }, [])

  const loadAll = useCallback(() => {
    auth.me().then(r => setReplyTo(r.data.reply_to_email || '')).catch(() => {})
    loadSent()
    loadTemplates()
  }, [loadSent, loadTemplates])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const state = location.state
    if (!state?.compose) return
    setActiveTab('sent')
    setSelectedEmailId(null)
    if (state.clientId) {
      setComposeClientId(state.clientId)
      setComposeRecipient({
        clientId: state.clientId,
        name: state.clientName || '',
        email: state.email || '',
        initials: getInitials(state.clientName || state.email || ''),
      })
    } else {
      setComposeRecipient(EMPTY_RECIPIENT)
    }
    if (state.orderId) setComposeOrderId(state.orderId)
    setComposeKey(k => k + 1)
    window.history.replaceState({}, document.title)
  }, [location.state])

  const saveReplyTo = async () => {
    setSavingReply(true)
    try {
      await auth.updateMe({ reply_to_email: replyTo })
      setReplySaved(true)
      setTimeout(() => setReplySaved(false), 2500)
    } finally {
      setSavingReply(false)
    }
  }

  const handleTabChange = tab => {
    setActiveTab(tab)
    if (tab === 'sent') {
      setSelectedTemplate(null)
      setTemplateDraft(null)
    } else {
      setSelectedEmailId(null)
    }
  }

  const handleEmailSent = () => {
    loadSent()
    setSelectedEmailId(null)
    setComposeRecipient(EMPTY_RECIPIENT)
    setComposeOrderId(null)
    setComposeClientId(null)
    setComposeKey(k => k + 1)
  }

  const handleReply = email => {
    setSelectedEmailId(null)
    setComposeRecipient({
      clientId: email.client,
      name: email.client_name || email.to_email,
      email: email.to_email,
      initials: getInitials(email.client_name || email.to_email),
    })
    setComposeClientId(email.client || null)
    setComposeOrderId(email.order || null)
    setComposeKey(k => k + 1)
  }

  const newTemplate = () => {
    setSelectedTemplate('new')
    setTemplateDraft({ ...EMPTY_TEMPLATE })
  }

  const selectTemplate = tpl => {
    setSelectedTemplate(tpl.id)
    setTemplateDraft({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body })
  }

  const saveTemplate = async () => {
    if (!templateDraft?.name?.trim()) return
    setSavingTemplate(true)
    try {
      if (templateDraft.id) {
        await messagingApi.templates.update(templateDraft.id, templateDraft)
      } else {
        await messagingApi.templates.create(templateDraft)
      }
      loadTemplates()
      setSelectedTemplate(null)
      setTemplateDraft(null)
    } finally {
      setSavingTemplate(false)
    }
  }

  const deleteTemplate = async () => {
    if (!templateDraft?.id) return
    if (!confirm('Удалить шаблон?')) return
    await messagingApi.templates.delete(templateDraft.id)
    loadTemplates()
    setSelectedTemplate(null)
    setTemplateDraft(null)
  }

  const rightPanelMode = activeTab === 'sent'
    ? (selectedEmailId ? 'preview' : 'compose')
    : 'template'

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      <EmailNavSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        replyTo={replyTo}
        onReplyToChange={setReplyTo}
        onSaveReplyTo={saveReplyTo}
        savingReply={savingReply}
        replySaved={replySaved}
      />

      <div style={{
        width: 320, flexShrink: 0, borderRight: '1px solid var(--border)',
        background: 'var(--bg-card)', display: 'flex', flexDirection: 'column',
        minHeight: 0, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
            {activeTab === 'sent' ? 'Отправленные' : 'Шаблоны'}
          </span>
          {activeTab === 'sent' && selectedEmailId && (
            <button type="button" onClick={() => setSelectedEmailId(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.78rem', color: 'var(--accent)', fontFamily: 'var(--font-body)',
            }}>
              Новое письмо
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'sent' ? (
            sentEmails.length === 0
              ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Писем пока нет</div>
              : sentEmails.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedEmailId(e.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    borderBottom: '1px solid var(--border)',
                    background: selectedEmailId === e.id ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    {e.to_email} · {formatEmailDate(e.sent_at)}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.subject}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.body}
                  </div>
                </button>
              ))
          ) : (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Button size="sm" onClick={newTemplate} style={{ width: '100%' }}>+ Новый шаблон</Button>
              </div>
              {templates.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Шаблонов пока нет</div>
                : templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px',
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      borderBottom: '1px solid var(--border)',
                      background: selectedTemplate === t.id ? 'var(--accent-light)' : 'transparent',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </div>
                  </button>
                ))
              }
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, background: 'var(--bg-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rightPanelMode === 'compose' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ComposeEmailForm
              key={composeKey}
              recipient={composeRecipient}
              orderId={composeOrderId}
              clientId={composeClientId}
              templates={templates}
              onSent={handleEmailSent}
            />
          </div>
        )}
        {rightPanelMode === 'preview' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <SentEmailPreview email={selectedEmail} onReply={handleReply} />
          </div>
        )}
        {rightPanelMode === 'template' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <TemplateEditor
              template={templateDraft}
              onChange={setTemplateDraft}
              onSave={saveTemplate}
              onDelete={deleteTemplate}
              saving={savingTemplate}
              isNew={selectedTemplate === 'new'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
