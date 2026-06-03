import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { leads as leadsApi } from '../api'
import { useAuth } from './AuthContext'

const LeadsContext = createContext(null)

export function LeadsProvider({ children }) {
  const { user } = useAuth()
  const [newCount, setNewCount] = useState(0)
  const [toast, setToast] = useState(null)
  const prevIdsRef = useRef(null)
  const timerRef = useRef(null)

  const check = useCallback(async () => {
    if (!user) return
    try {
      const r = await leadsApi.list({ status: 'new' })
      const items = r.data.results || r.data
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/57ceb7b4-465a-4cb5-97b8-f8cb49bcb906',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fefc84'},body:JSON.stringify({sessionId:'fefc84',location:'LeadsContext.jsx:check',message:'new leads poll',data:{itemsLength:items.length,apiCount:r.data.count??null},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setNewCount(items.length)
      if (prevIdsRef.current === null) {
        prevIdsRef.current = new Set(items.map(l => l.id))
        return
      }
      const truly = items.filter(l => !prevIdsRef.current.has(l.id))
      prevIdsRef.current = new Set(items.map(l => l.id))
      if (truly.length > 0) {
        setToast(truly[0])
        setTimeout(() => setToast(null), 6000)
      }
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/57ceb7b4-465a-4cb5-97b8-f8cb49bcb906',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fefc84'},body:JSON.stringify({sessionId:'fefc84',location:'LeadsContext.jsx:check',message:'new leads poll failed',data:{status:e?.response?.status??null},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    check()
    timerRef.current = setInterval(check, 15000)
    return () => clearInterval(timerRef.current)
  }, [user, check])

  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) Freelancer ARM` : 'Freelancer ARM'
  }, [newCount])

  return (
    <LeadsContext.Provider value={{ newCount, toast, dismissToast: () => setToast(null) }}>
      {children}
    </LeadsContext.Provider>
  )
}

export const useLeads = () => useContext(LeadsContext)
