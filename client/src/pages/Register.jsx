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
  const strengthColors = ['', '#f87171', '#fbbf24', '#34d399']
  const strengthLabels = ['', 'Too short', 'Okay', 'Strong']
  const strengthTextColors = ['', 'text-red-500', 'text-amber-500', 'text-emerald-500']

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
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
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
            Start your health journey today
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
              <label className="label">Full name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jane Smith"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
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
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="new-password"
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

              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= pwStrength
                            ? strengthColors[pwStrength]
                            : 'rgba(0,0,0,0.08)',
                        }}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strengthTextColors[pwStrength]}`}>
                    {strengthLabels[pwStrength]}
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <div
            className="mt-5 pt-4 text-center text-sm text-gray-500 dark:text-gray-400"
            style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}
          >
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}