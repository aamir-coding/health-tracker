import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/healthApi'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Too short', 'Okay', 'Strong']
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500']
  const strengthText = ['', 'text-red-500', 'text-amber-600 dark:text-amber-400', 'text-green-600 dark:text-green-400']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      signIn(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
            <Heart className="w-7 h-7 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Start tracking your health today</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3.5 py-2.5 rounded-lg">{error}</div>
            )}
            <div>
              <label className="label">Full name</label>
              <input type="text" className="input-field" placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-200 ${i <= pwStrength ? strengthColor[pwStrength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${strengthText[pwStrength]}`}>{strengthLabel[pwStrength]}</p>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</span> : 'Create account'}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}