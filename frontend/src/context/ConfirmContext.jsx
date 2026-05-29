import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ConfirmDialog } from '../components/ui'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { title: options } : options
    return new Promise((resolve) => {
      setState({ ...opts, resolve })
    })
  }, [])

  const close = (result) => {
    state?.resolve(result)
    setState(null)
  }

  useEffect(() => {
    if (!state) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [state])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <ConfirmDialog
          open
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel || 'Удалить'}
          cancelLabel={state.cancelLabel || 'Отмена'}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
