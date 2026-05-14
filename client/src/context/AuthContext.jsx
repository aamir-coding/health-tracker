import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ht_token')
    const stored = localStorage.getItem('ht_user')
    if (token && stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.removeItem('ht_token'); localStorage.removeItem('ht_user') }
    }
    setLoading(false)
  }, [])

  const signIn = (token, userData) => {
    localStorage.setItem('ht_token', token)
    localStorage.setItem('ht_user', JSON.stringify(userData))
    setUser(userData)
  }

  const signOut = () => {
    localStorage.removeItem('ht_token')
    localStorage.removeItem('ht_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('ht_user', JSON.stringify(updated))
      return updated
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}