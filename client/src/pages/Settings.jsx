import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Shield, SlidersHorizontal, Target, Info,
  Camera, Check, AlertTriangle, Eye, EyeOff, Download,
  Trash2, ChevronRight, Sun, Moon, Monitor, Globe,
  Ruler, Weight, Heart,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { authApi, logsApi } from '../api/healthApi'
import Layout from '../components/Layout'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'goals', label: 'Health Goals', icon: Target },
  { id: 'about', label: 'Support & About', icon: Info },
]

const LANGUAGES = [
  { code: 'en', label: 'English', available: true },
  { code: 'hi', label: 'Hindi', available: false },
  { code: 'ta', label: 'Tamil', available: false },
  { code: 'es', label: 'Spanish', available: false },
  { code: 'fr', label: 'French', available: false },
]

const GENDERS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const MOOD_LABELS = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }

function Card({ title, description, children }) {
  return (
    <div className="card p-5 lg:p-6">
      {(title || description) && (
        <div className="mb-5">
          {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
          {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

function StatusMsg({ status }) {
  if (!status) return null
  const ok = status.type === 'success'
  return (
    <div className={`flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-lg mt-3 ${
      ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
         : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    }`}>
      {ok ? <Check size={15} /> : <AlertTriangle size={15} />}
      {status.msg}
    </div>
  )
}

function SaveBtn({ loading, label = 'Save changes' }) {
  return (
    <button type="submit" disabled={loading} className="btn-primary gap-2 mt-4">
      {loading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : <><Check size={14} />{label}</>}
    </button>
  )
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('File must be an image')); return }
    if (file.size > 5 * 1024 * 1024) { reject(new Error('Image must be under 5 MB')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const SIZE = 120
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => reject(new Error('Could not read image'))
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function ProfileSection({ user, updateUser }) {
  const fileRef = useRef()
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [personal, setPersonal] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    gender: user?.gender || '',
  })
  const [height, setHeight] = useState(user?.height || '')
  const [loading, setLoading] = useState({ personal: false, height: false, avatar: false })
  const [status, setStatus] = useState({ personal: null, height: null, avatar: null })

  const setL = (k, v) => setLoading(p => ({ ...p, [k]: v }))
  const setS = (k, v) => setStatus(p => ({ ...p, [k]: v }))

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setAvatarPreview(compressed)
      setL('avatar', true); setS('avatar', null)
      const { data } = await authApi.updateProfile({ avatar: compressed })
      updateUser(data.user)
      setS('avatar', { type: 'success', msg: 'Photo updated!' })
    } catch (err) {
      setS('avatar', { type: 'error', msg: err.message || 'Failed to upload photo' })
    } finally {
      setL('avatar', false)
      e.target.value = ''
    }
  }

  const removeAvatar = async () => {
    setL('avatar', true)
    try {
      const { data } = await authApi.updateProfile({ avatar: '' })
      updateUser(data.user)
      setAvatarPreview('')
      setS('avatar', { type: 'success', msg: 'Photo removed' })
    } catch {
      setS('avatar', { type: 'error', msg: 'Failed to remove photo' })
    } finally {
      setL('avatar', false)
    }
  }

  const savePersonal = async (e) => {
    e.preventDefault()
    setL('personal', true); setS('personal', null)
    try {
      const payload = { ...personal }
      if (!payload.dateOfBirth) delete payload.dateOfBirth
      const { data } = await authApi.updateProfile(payload)
      updateUser(data.user)
      setS('personal', { type: 'success', msg: 'Personal info updated!' })
    } catch (err) {
      setS('personal', { type: 'error', msg: err.response?.data?.error || 'Failed to save' })
    } finally {
      setL('personal', false)
    }
  }

  const saveHeight = async (e) => {
    e.preventDefault()
    setL('height', true); setS('height', null)
    try {
      const { data } = await authApi.updateProfile({ height: height ? Number(height) : null })
      updateUser(data.user)
      setS('height', { type: 'success', msg: 'Body metrics updated!' })
    } catch (err) {
      setS('height', { type: 'error', msg: err.response?.data?.error || 'Failed to save' })
    } finally {
      setL('height', false)
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="space-y-4">
      {/* Profile Picture */}
      <Card title="Profile picture">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
              : <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{initials}</span>
                </div>
            }
            {loading.avatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{user?.name}</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary gap-1.5 text-xs py-1.5 px-3">
                <Camera size={13} />Change photo
              </button>
              {avatarPreview && (
                <button type="button" onClick={removeAvatar} className="btn-secondary gap-1.5 text-xs py-1.5 px-3 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={13} />Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">JPG, PNG. Max 5 MB. Auto-cropped to square.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>
        </div>
        <StatusMsg status={status.avatar} />
      </Card>

      {/* Personal Information */}
      <Card title="Personal information" description="Your name and profile details">
        <form onSubmit={savePersonal} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input type="text" className="input-field" value={personal.name} onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))} maxLength={50} required />
          </div>
          <div>
            <label className="label">Bio <span className="text-gray-400 dark:text-gray-500 font-normal">{personal.bio.length}/200</span></label>
            <textarea className="input-field resize-none" rows={2} value={personal.bio} onChange={e => setPersonal(p => ({ ...p, bio: e.target.value }))} maxLength={200} placeholder="Tell us a bit about yourself…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input-field" value={personal.dateOfBirth} onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} max={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={personal.gender} onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>
          <SaveBtn loading={loading.personal} />
          <StatusMsg status={status.personal} />
        </form>
      </Card>

      {/* Body Metrics */}
      <Card title="Body metrics" description="Used to calculate your BMI">
        <form onSubmit={saveHeight} className="space-y-4">
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input-field" value={height} onChange={e => setHeight(e.target.value)} min={50} max={300} step={1} placeholder="e.g. 175" />
            {height && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {Math.floor(height / 30.48)}'{Math.round((height % 30.48) / 2.54)}" in imperial
              </p>
            )}
          </div>
          <SaveBtn loading={loading.height} />
          <StatusMsg status={status.height} />
        </form>
      </Card>
    </div>
  )
}

function AccountSection({ user, updateUser }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState({ pw: false, export: false, delete: false })
  const [status, setStatus] = useState({ pw: null, delete: null })

  const setL = (k, v) => setLoading(p => ({ ...p, [k]: v }))
  const setS = (k, v) => setStatus(p => ({ ...p, [k]: v }))

  const pwStrength = pw.new.length === 0 ? 0 : pw.new.length < 6 ? 1 : pw.new.length < 10 ? 2 : 3
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500']

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) { setS('pw', { type: 'error', msg: 'New passwords do not match' }); return }
    setL('pw', true); setS('pw', null)
    try {
      await authApi.changePassword({ currentPassword: pw.current, newPassword: pw.new })
      setPw({ current: '', new: '', confirm: '' })
      setS('pw', { type: 'success', msg: 'Password changed successfully!' })
    } catch (err) {
      setS('pw', { type: 'error', msg: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to change password' })
    } finally {
      setL('pw', false)
    }
  }

  const exportData = async () => {
    setL('export', true)
    try {
      const { data } = await logsApi.getAll({ limit: 1000, page: 1 })
      const logs = data.logs || []
      const headers = ['Date', 'Steps', 'Sleep (hrs)', 'Water (ml)', 'Weight (kg)', 'Mood (1-5)', 'Notes']
      const rows = logs.map(l => [
        l.date?.slice(0, 10) || '',
        l.steps ?? '',
        l.sleepHours ?? '',
        l.waterMl ?? '',
        l.weight ?? '',
        l.mood ?? '',
        l.notes ? `"${l.notes.replace(/"/g, '""')}"` : '',
      ])
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `healthtrack-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to export. Please try again.')
    } finally {
      setL('export', false)
    }
  }

  const deleteAccount = async () => {
    if (!deleteConfirm) { setS('delete', { type: 'error', msg: 'Please enter your password to confirm' }); return }
    setL('delete', true); setS('delete', null)
    try {
      await authApi.deleteAccount({ password: deleteConfirm })
      signOut()
      navigate('/login')
    } catch (err) {
      setS('delete', { type: 'error', msg: err.response?.data?.error || 'Failed to delete account' })
    } finally {
      setL('delete', false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Contact Info */}
      <Card title="Contact information" description="Your login email address">
        <div>
          <label className="label">Email address</label>
          <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user?.email || ''} readOnly />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Email changes require identity verification. Contact support to update your email.</p>
        </div>
      </Card>

      {/* Password */}
      <Card title="Security & login" description="Change your account password">
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <input type={showPw.current ? 'text' : 'password'} className="input-field pr-10" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <input type={showPw.new ? 'text' : 'password'} className="input-field pr-10" value={pw.new} onChange={e => setPw(p => ({ ...p, new: e.target.value }))} autoComplete="new-password" required placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pw.new.length > 0 && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwStrength ? strengthColors[pwStrength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className={`input-field ${pw.confirm && pw.confirm !== pw.new ? 'border-red-400 focus:ring-red-400' : ''}`} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" required />
            {pw.confirm && pw.confirm !== pw.new && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
          </div>
          <SaveBtn loading={loading.pw} label="Change password" />
          <StatusMsg status={status.pw} />
        </form>
      </Card>

      {/* Data Management */}
      <Card title="Data management" description="Export or delete your data">
        <div className="space-y-5">
          {/* Export */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Export your data</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Download all your health logs as a CSV file</p>
            </div>
            <button onClick={exportData} disabled={loading.export} className="btn-secondary gap-1.5 flex-shrink-0 text-xs py-1.5 px-3">
              {loading.export ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <Download size={13} />}
              Export CSV
            </button>
          </div>

          {/* Danger zone */}
          <div className="border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-red-500" />
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Permanently deletes your account and all health data. This action cannot be undone.</p>

            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">
                Delete my account →
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Enter your password to confirm:</p>
                <input type="password" className="input-field text-sm" placeholder="Your password" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); setS('delete', null) }} className="btn-secondary text-xs py-1.5 px-3 flex-1">Cancel</button>
                  <button onClick={deleteAccount} disabled={loading.delete} className="btn-danger text-xs py-1.5 px-3 flex-1 gap-1">
                    {loading.delete ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={12} />}
                    Delete account
                  </button>
                </div>
                <StatusMsg status={status.delete} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function PreferencesSection({ user, updateUser }) {
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState({ units: false, lang: false })
  const [status, setStatus] = useState({ units: null, lang: null })

  const saveUnits = async (units) => {
    setSaving(p => ({ ...p, units: true }))
    try {
      const { data } = await authApi.updatePreferences({ units })
      updateUser({ preferences: { ...user.preferences, units: data.user.preferences.units } })
      setStatus(p => ({ ...p, units: { type: 'success', msg: `Switched to ${units}` } }))
      setTimeout(() => setStatus(p => ({ ...p, units: null })), 2000)
    } catch {
      setStatus(p => ({ ...p, units: { type: 'error', msg: 'Failed to save' } }))
    } finally {
      setSaving(p => ({ ...p, units: false }))
    }
  }

  const saveLang = async (language) => {
    setSaving(p => ({ ...p, lang: true }))
    try {
      const { data } = await authApi.updatePreferences({ language })
      updateUser({ preferences: { ...user.preferences, language: data.user.preferences.language } })
      setStatus(p => ({ ...p, lang: { type: 'success', msg: 'Language saved' } }))
      setTimeout(() => setStatus(p => ({ ...p, lang: null })), 2000)
    } catch {
      setStatus(p => ({ ...p, lang: { type: 'error', msg: 'Failed to save' } }))
    } finally {
      setSaving(p => ({ ...p, lang: false }))
    }
  }

  const units = user?.preferences?.units || 'metric'
  const lang = user?.preferences?.language || 'en'

  const THEMES = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Always light' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Always dark' },
    { id: 'system', label: 'System', icon: Monitor, desc: 'Follow OS' },
  ]

  return (
    <div className="space-y-4">
      {/* Units */}
      <Card title="Units of measurement" description="Choose how values are displayed throughout the app">
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'metric', label: 'Metric', sub: 'kg · cm · ml', icon: '📏' },
            { id: 'imperial', label: 'Imperial', sub: 'lbs · ft · fl oz', icon: '🦅' },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => saveUnits(opt.id)}
              disabled={saving.units}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                units === opt.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-xl mb-1">{opt.icon}</div>
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{opt.label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{opt.sub}</div>
              {units === opt.id && <div className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"><Check size={12} />Active</div>}
            </button>
          ))}
        </div>
        <StatusMsg status={status.units} />
      </Card>

      {/* Language */}
      <Card title="Language" description="App display language">
        <div className="space-y-2">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => l.available && saveLang(l.code)}
              disabled={!l.available || saving.lang}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                lang === l.code && l.available
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${!l.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{l.label}</span>
                {!l.available && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Coming soon</span>}
              </div>
              {lang === l.code && l.available && <Check size={15} className="text-indigo-500" />}
            </button>
          ))}
        </div>
        <StatusMsg status={status.lang} />
      </Card>

      {/* Theme */}
      <Card title="Display theme" description="Choose your preferred colour scheme">
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`p-4 rounded-xl border-2 text-center transition-all duration-150 ${
                theme === id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon size={22} className={`mx-auto mb-2 ${theme === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Theme is saved automatically and synced across devices on next login.</p>
      </Card>
    </div>
  )
}

function GoalsSection({ user, updateUser }) {
  const [daily, setDaily] = useState({
    dailySteps: user?.goals?.dailySteps || '',
    dailySleepHours: user?.goals?.dailySleepHours || '',
    dailyWaterMl: user?.goals?.dailyWaterMl || '',
    targetMood: user?.goals?.targetMood || null,
  })
  const [longterm, setLongterm] = useState({
    targetWeight: user?.goals?.targetWeight || '',
  })
  const [loading, setLoading] = useState({ daily: false, longterm: false })
  const [status, setStatus] = useState({ daily: null, longterm: null })

  const saveDaily = async (e) => {
    e.preventDefault()
    setLoading(p => ({ ...p, daily: true })); setStatus(p => ({ ...p, daily: null }))
    try {
      const payload = {}
      if (daily.dailySteps !== '') payload.dailySteps = Number(daily.dailySteps)
      if (daily.dailySleepHours !== '') payload.dailySleepHours = Number(daily.dailySleepHours)
      if (daily.dailyWaterMl !== '') payload.dailyWaterMl = Number(daily.dailyWaterMl)
      if (daily.targetMood) payload.targetMood = daily.targetMood
      const { data } = await authApi.updateGoals(payload)
      updateUser({ goals: data.user.goals })
      setStatus(p => ({ ...p, daily: { type: 'success', msg: 'Daily targets saved!' } }))
    } catch (err) {
      setStatus(p => ({ ...p, daily: { type: 'error', msg: err.response?.data?.error || 'Failed to save' } }))
    } finally {
      setLoading(p => ({ ...p, daily: false }))
    }
  }

  const saveLongterm = async (e) => {
    e.preventDefault()
    setLoading(p => ({ ...p, longterm: true })); setStatus(p => ({ ...p, longterm: null }))
    try {
      const payload = {}
      if (longterm.targetWeight !== '') payload.targetWeight = Number(longterm.targetWeight)
      const { data } = await authApi.updateGoals(payload)
      updateUser({ goals: data.user.goals })
      setStatus(p => ({ ...p, longterm: { type: 'success', msg: 'Objectives saved!' } }))
    } catch (err) {
      setStatus(p => ({ ...p, longterm: { type: 'error', msg: err.response?.data?.error || 'Failed to save' } }))
    } finally {
      setLoading(p => ({ ...p, longterm: false }))
    }
  }

  const presets = {
    dailySteps: [5000, 7500, 10000, 12000],
    dailySleepHours: [6, 7, 8, 9],
    dailyWaterMl: [1500, 2000, 2500, 3000],
  }

  return (
    <div className="space-y-4">
      <Card title="Daily targets" description="Goals shown on your dashboard each day">
        <form onSubmit={saveDaily} className="space-y-5">
          {/* Steps */}
          <div>
            <label className="label">🚶 Daily steps goal</label>
            <input type="number" className="input-field mb-2" value={daily.dailySteps} onChange={e => setDaily(p => ({ ...p, dailySteps: e.target.value }))} min={0} max={100000} step={500} placeholder="e.g. 10000" />
            <div className="flex gap-1.5 flex-wrap">
              {presets.dailySteps.map(v => (
                <button key={v} type="button" onClick={() => setDaily(p => ({ ...p, dailySteps: v }))} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${daily.dailySteps == v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-400'}`}>
                  {(v / 1000).toFixed(v % 1000 ? 1 : 0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Sleep */}
          <div>
            <label className="label">🌙 Daily sleep goal (hours)</label>
            <input type="number" className="input-field mb-2" value={daily.dailySleepHours} onChange={e => setDaily(p => ({ ...p, dailySleepHours: e.target.value }))} min={0} max={24} step={0.5} placeholder="e.g. 7.5" />
            <div className="flex gap-1.5">
              {presets.dailySleepHours.map(v => (
                <button key={v} type="button" onClick={() => setDaily(p => ({ ...p, dailySleepHours: v }))} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${daily.dailySleepHours == v ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400'}`}>
                  {v}h
                </button>
              ))}
            </div>
          </div>

          {/* Water */}
          <div>
            <label className="label">💧 Daily water goal (ml)</label>
            <input type="number" className="input-field mb-2" value={daily.dailyWaterMl} onChange={e => setDaily(p => ({ ...p, dailyWaterMl: e.target.value }))} min={0} max={20000} step={250} placeholder="e.g. 2000" />
            <div className="flex gap-1.5 flex-wrap">
              {presets.dailyWaterMl.map(v => (
                <button key={v} type="button" onClick={() => setDaily(p => ({ ...p, dailyWaterMl: v }))} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${daily.dailyWaterMl == v ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-cyan-400'}`}>
                  {v >= 1000 ? `${v / 1000}L` : `${v}ml`}
                </button>
              ))}
            </div>
          </div>

          {/* Mood target */}
          <div>
            <label className="label">😊 Mood target</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} type="button" onClick={() => setDaily(p => ({ ...p, targetMood: p.targetMood === v ? null : v }))}
                  className={`flex-1 py-2.5 rounded-xl text-xl border-2 transition-all ${daily.targetMood === v ? 'border-green-400 bg-green-50 dark:bg-green-900/30 scale-110' : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {MOOD_LABELS[v]}
                </button>
              ))}
            </div>
            {daily.targetMood && <p className="text-xs text-green-600 dark:text-green-400 text-center mt-1.5 font-medium">Target: {['', 'Very bad', 'Bad', 'Okay', 'Good', 'Great'][daily.targetMood]}</p>}
          </div>

          <SaveBtn loading={loading.daily} label="Save daily targets" />
          <StatusMsg status={status.daily} />
        </form>
      </Card>

      <Card title="Long-term objectives" description="Goals you're working towards over time">
        <form onSubmit={saveLongterm} className="space-y-4">
          <div>
            <label className="label">⚖️ Target weight (kg)</label>
            <input type="number" className="input-field" value={longterm.targetWeight} onChange={e => setLongterm(p => ({ ...p, targetWeight: e.target.value }))} min={1} max={500} step={0.1} placeholder="e.g. 65.0" />
            {user?.goals?.targetWeight && user?.height && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Target BMI: {(user.goals.targetWeight / Math.pow(user.height / 100, 2)).toFixed(1)}
              </p>
            )}
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              💡 Set your height in the Profile section to see target BMI alongside this goal.
            </p>
          </div>
          <SaveBtn loading={loading.longterm} label="Save objectives" />
          <StatusMsg status={status.longterm} />
        </form>
      </Card>
    </div>
  )
}

function AboutSection() {
  const STACK = [
    { label: 'Frontend', items: 'React 18, Vite, Tailwind CSS, Recharts' },
    { label: 'Backend', items: 'Node.js, Express.js, Socket.io' },
    { label: 'Database', items: 'MongoDB Atlas, Mongoose' },
    { label: 'Auth', items: 'JWT, bcrypt' },
    { label: 'AI', items: 'Groq (LLaMA 3 8B)' },
    { label: 'DevOps', items: 'Docker, GitHub Actions, Render, Vercel' },
  ]

  const TIPS = [
    { icon: '📅', text: 'Log daily to build your streak and unlock AI insights' },
    { icon: '🎯', text: 'Set goals in this page to see progress bars on your dashboard' },
    { icon: '📊', text: 'Switch between metrics using the pills on the trend chart' },
    { icon: '📥', text: 'Export your data anytime from Account → Data Management' },
    { icon: '🌙', text: 'Enable dark mode or use System to follow your device preference' },
    { icon: '📱', text: 'Install the app on your phone from your browser menu for a native feel' },
  ]

  return (
    <div className="space-y-4">
      <Card title="App information">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900">
            <Heart className="w-7 h-7 text-white" fill="white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-lg">HealthTrack</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Version 1.0.0</div>
            <div className="text-xs text-indigo-500 mt-0.5">Modern Application Development — Assignment Project</div>
          </div>
        </div>
        <div className="space-y-2">
          {STACK.map(({ label, items }) => (
            <div key={label} className="flex gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-20 flex-shrink-0 pt-0.5">{label}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{items}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Quick tips">
        <div className="space-y-3">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-base flex-shrink-0">{tip.icon}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tip.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Support">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>HealthTrack is an open-source assignment project. For issues or suggestions, open a GitHub issue on the repository.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <ChevronRight size={12} />GitHub Repository
            </a>
            <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <ChevronRight size={12} />Anthropic Docs
            </a>
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <ChevronRight size={12} />Groq Console
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [active, setActive] = useState('profile')

  const content = {
    profile: <ProfileSection user={user} updateUser={updateUser} />,
    account: <AccountSection user={user} updateUser={updateUser} />,
    preferences: <PreferencesSection user={user} updateUser={updateUser} />,
    goals: <GoalsSection user={user} updateUser={updateUser} />,
    about: <AboutSection />,
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Manage your profile, preferences and health goals</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-6">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  active === id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={16} className={active === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile tab scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 border transition-all ${
                  active === id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {content[active]}
        </div>
      </div>
    </Layout>
  )
}