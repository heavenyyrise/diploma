import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('access')) {
      auth.me().then(r => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await auth.login({ username: email, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    setUser({ id: data.id, username: data.username, email: data.email, first_name: data.first_name })
  }

  const logout = () => { localStorage.clear(); setUser(null) }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
