import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ht_token')
    const storedUser = localStorage.getItem('ht_user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('ht_token')
        localStorage.removeItem('ht_user')
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}