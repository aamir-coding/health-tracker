import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Heart, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/healthApi'

const DEMO_CREDENTIALS = {
  email: 'demo@healthtracker.com',
  password: '123demo456',
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleLogin = async (credentials) => {
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(credentials)
      signIn(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Login failed. Please check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // Client-side validations with specific messages
    if (!form.email || form.email.trim() === '') { setError('Please enter your email address.'); return }
    if (form.email.indexOf('@') === -1) { setError("Email must contain '@'."); return }
    if (form.email.includes(',')) { setError('Email cannot contain commas.'); return }
    if (!form.password || form.password.trim() === '') { setError('Please enter your password.'); return }
    await handleLogin(form)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            HealthTrack
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Glass card */}
        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="alert-glass alert-error">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => { set('email', e.target.value); if (error) setError('') }}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { set('password', e.target.value); if (error) setError('') }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div
            className="mt-5 pt-4 text-center text-sm text-gray-500 dark:text-gray-400"
            style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}
          >
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Create one free
            </Link>
          </div>
        </div>

        {/* Demo access */}
        <div
          className="mt-3 px-5 py-4 rounded-2xl text-sm text-gray-500 dark:text-gray-400"
          style={{
            background: 'rgba(255,255,255,0.38)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <div className="text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Demo access</p>
            <p className="text-xs mt-1">Explore the pre-populated app without registering.</p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-3 text-xs">
            <span className="text-gray-400 dark:text-gray-500">Email</span>
            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{DEMO_CREDENTIALS.email}</span>
            <span className="text-gray-400 dark:text-gray-500">Password</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{DEMO_CREDENTIALS.password}</span>
          </div>
          <button
            type="button"
            onClick={() => handleLogin(DEMO_CREDENTIALS)}
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-4 gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              <><LogIn size={15} />Continue with demo account</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}