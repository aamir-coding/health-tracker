import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Shield, SlidersHorizontal, Target, Info,
  Camera, Check, AlertTriangle, Eye, EyeOff, Download,
  Trash2, ChevronRight, Sun, Moon, Monitor, Globe,
  Ruler, Scale, Footprints, Droplets, Smile, Lightbulb,
  CalendarDays, BarChart2, Smartphone, Heart, Activity,
  Frown, Meh, SmilePlus, Laugh,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { authApi, logsApi } from '../api/healthApi'
import GlowIcon, { MoodIcon } from '../components/GlowIcon'
import Layout from '../components/Layout'

const SECTIONS = [
  { id:'profile',     label:'Profile',     icon:User             },
  { id:'account',     label:'Account',     icon:Shield           },
  { id:'preferences', label:'Preferences', icon:SlidersHorizontal},
  { id:'goals',       label:'Health Goals',icon:Target           },
  { id:'about',       label:'Support',     icon:Info             },
]

const LANGUAGES = [
  { code:'en', label:'English', available:true  },
  { code:'hi', label:'Hindi',   available:false },
  { code:'fr', label:'French',  available:false },
]

const GENDERS = [
  { value:'',                 label:'Prefer not to say' },
  { value:'male',             label:'Male'              },
  { value:'female',           label:'Female'            },
  { value:'other',            label:'Other'             },
]

function GlassCard({ title, description, children }) {
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
    <div
      className={`flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl mt-3 ${
        ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
      }`}
      style={{
        background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${ok ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
      }}
    >
      {ok ? <Check size={14} /> : <AlertTriangle size={14} />}
      {status.msg}
    </div>
  )
}

function SaveBtn({ loading, label = 'Save changes' }) {
  return (
    <button type="submit" disabled={loading} className="btn-primary gap-2 mt-4">
      {loading
        ? <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving…
          </span>
        : <><Check size={14} />{label}</>
      }
    </button>
  )
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('File must be an image')); return }
    if (file.size > 5 * 1024 * 1024)    { reject(new Error('Image must be under 5 MB')); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const SIZE = 120
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, SIZE, SIZE)
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
    name:        user?.name        || '',
    bio:         user?.bio         || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0,10) : '',
    gender:      user?.gender      || '',
  })
  const [height, setHeight]   = useState(user?.height || '')
  const [loading, setLoading] = useState({ personal:false, height:false, avatar:false })
  const [status,  setStatus]  = useState({ personal:null,  height:null,  avatar:null  })

  const setL = (k,v) => setLoading(p=>({...p,[k]:v}))
  const setS = (k,v) => setStatus(p=>({...p,[k]:v}))

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const compressed = await compressImage(file)
      setAvatarPreview(compressed)
      setL('avatar', true); setS('avatar', null)
      const { data } = await authApi.updateProfile({ avatar: compressed })
      updateUser(data.user)
      setS('avatar', { type:'success', msg:'Photo updated!' })
    } catch (err) {
      setS('avatar', { type:'error', msg: err.message || 'Failed to upload photo' })
    } finally {
      setL('avatar', false); e.target.value = ''
    }
  }

  const removeAvatar = async () => {
    setL('avatar', true)
    try {
      const { data } = await authApi.updateProfile({ avatar:'' })
      updateUser(data.user); setAvatarPreview('')
      setS('avatar', { type:'success', msg:'Photo removed' })
    } catch {
      setS('avatar', { type:'error', msg:'Failed to remove photo' })
    } finally { setL('avatar', false) }
  }

  const savePersonal = async (e) => {
    e.preventDefault(); setL('personal', true); setS('personal', null)
    try {
      const payload = { ...personal }
      if (!payload.dateOfBirth) delete payload.dateOfBirth
      const { data } = await authApi.updateProfile(payload)
      updateUser(data.user)
      setS('personal', { type:'success', msg:'Personal info updated!' })
    } catch (err) {
      setS('personal', { type:'error', msg: err.response?.data?.error || 'Failed to save' })
    } finally { setL('personal', false) }
  }

  const saveHeight = async (e) => {
    e.preventDefault(); setL('height', true); setS('height', null)
    try {
      const { data } = await authApi.updateProfile({ height: height ? Number(height) : null })
      updateUser(data.user)
      setS('height', { type:'success', msg:'Body metrics updated!' })
    } catch (err) {
      setS('height', { type:'error', msg: err.response?.data?.error || 'Failed to save' })
    } finally { setL('height', false) }
  }

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || '?'

  return (
    <div className="space-y-4">
      {/* Profile picture */}
      <GlassCard title="Profile picture">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover"
                  style={{ boxShadow:'0 0 0 2px rgba(99,102,241,0.3), 0 0 16px rgba(99,102,241,0.2)' }} />
              : <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 0 20px rgba(99,102,241,0.4)' }}>
                  <span className="text-2xl font-bold text-white">{initials}</span>
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
                <button type="button" onClick={removeAvatar}
                  className="btn-secondary gap-1.5 text-xs py-1.5 px-3 text-red-500 dark:text-red-400">
                  <Trash2 size={13} />Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">JPG, PNG. Max 5 MB.</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>
        </div>
        <StatusMsg status={status.avatar} />
      </GlassCard>

      {/* Personal info */}
      <GlassCard title="Personal information">
        <form onSubmit={savePersonal} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input type="text" className="input-field" value={personal.name} maxLength={50} required
              onChange={e => setPersonal(p=>({...p,name:e.target.value}))} />
          </div>
          <div>
            <label className="label">
              Bio <span className="text-gray-400 dark:text-gray-500 font-normal">{personal.bio.length}/200</span>
            </label>
            <textarea className="input-field resize-none" rows={2} maxLength={200}
              placeholder="Tell us a bit about yourself…"
              value={personal.bio} onChange={e => setPersonal(p=>({...p,bio:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input-field" value={personal.dateOfBirth}
                max={new Date().toISOString().slice(0,10)}
                onChange={e => setPersonal(p=>({...p,dateOfBirth:e.target.value}))} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={personal.gender}
                onChange={e => setPersonal(p=>({...p,gender:e.target.value}))}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>
          <SaveBtn loading={loading.personal} />
          <StatusMsg status={status.personal} />
        </form>
      </GlassCard>

      {/* Body metrics */}
      <GlassCard title="Body metrics" description="Used to calculate your BMI on the dashboard">
        <form onSubmit={saveHeight} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GlowIcon icon={Ruler} color="amber" size="xs" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
            </div>
            <input type="number" className="input-field" value={height} min={50} max={300} step={1}
              placeholder="e.g. 175" onChange={e => setHeight(e.target.value)} />
            {height && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {Math.floor(height/30.48)}'{Math.round((height%30.48)/2.54)}" in imperial
              </p>
            )}
          </div>
          <SaveBtn loading={loading.height} />
          <StatusMsg status={status.height} />
        </form>
      </GlassCard>
    </div>
  )
}

function AccountSection({ user, updateUser }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [pw, setPw]   = useState({ current:'', new:'', confirm:'' })
  const [showPw, setShowPw] = useState({ current:false, new:false })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState({ pw:false, export:false, delete:false })
  const [status,  setStatus]  = useState({ pw:null, delete:null })

  const setL = (k,v) => setLoading(p=>({...p,[k]:v}))
  const setS = (k,v) => setStatus(p=>({...p,[k]:v}))

  const pwStrength = pw.new.length===0?0:pw.new.length<6?1:pw.new.length<10?2:3
  const strengthColors = ['','#f87171','#fbbf24','#34d399']

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) { setS('pw',{type:'error',msg:'Passwords do not match'}); return }
    setL('pw',true); setS('pw',null)
    try {
      await authApi.changePassword({ currentPassword:pw.current, newPassword:pw.new })
      setPw({current:'',new:'',confirm:''})
      setS('pw',{type:'success',msg:'Password changed successfully!'})
    } catch (err) {
      setS('pw',{type:'error',msg:err.response?.data?.error||err.response?.data?.errors?.[0]?.msg||'Failed'})
    } finally { setL('pw',false) }
  }

  const exportData = async () => {
    setL('export',true)
    try {
      const { data } = await logsApi.getAll({ limit:1000, page:1 })
      const logs = data.logs || []
      const headers = ['Date','Steps','Sleep (hrs)','Water (ml)','Weight (kg)','Mood (1-5)','Notes']
      const rows = logs.map(l => [
        l.date?.slice(0,10)||'', l.steps??'', l.sleepHours??'',
        l.waterMl??'', l.weight??'', l.mood??'',
        l.notes ? `"${l.notes.replace(/"/g,'""')}"` : '',
      ])
      const csv  = [headers,...rows].map(r=>r.join(',')).join('\n')
      const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `healthtrack-export-${new Date().toISOString().slice(0,10)}.csv`
      a.click(); URL.revokeObjectURL(url)
    } catch { alert('Failed to export. Please try again.') }
    finally { setL('export',false) }
  }

  const deleteAccount = async () => {
    if (!deleteConfirm) { setS('delete',{type:'error',msg:'Enter your password to confirm'}); return }
    setL('delete',true); setS('delete',null)
    try {
      await authApi.deleteAccount({ password:deleteConfirm })
      signOut(); navigate('/login')
    } catch (err) {
      setS('delete',{type:'error',msg:err.response?.data?.error||'Failed to delete account'})
    } finally { setL('delete',false) }
  }

  return (
    <div className="space-y-4">
      <GlassCard title="Contact information">
        <div>
          <label className="label">Email address</label>
          <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user?.email||''} readOnly />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            Email changes require identity verification. Contact support to update your email.
          </p>
        </div>
      </GlassCard>

      <GlassCard title="Security & login" description="Change your account password">
        <form onSubmit={changePassword} className="space-y-4">
          {[
            { key:'current', label:'Current password', auto:'current-password' },
            { key:'new',     label:'New password',     auto:'new-password',     placeholder:'Min. 6 characters' },
          ].map(({ key, label, auto, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={pw[key]}
                  autoComplete={auto}
                  placeholder={placeholder}
                  required
                  onChange={e => setPw(p=>({...p,[key]:e.target.value}))}
                />
                <button type="button" onClick={() => setShowPw(p=>({...p,[key]:!p[key]}))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPw[key] ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {key==='new' && pw.new.length>0 && (
                <div className="mt-2 flex gap-1.5">
                  {[1,2,3].map(i=>(
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i<=pwStrength ? strengthColors[pwStrength] : 'rgba(0,0,0,0.08)' }}/>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className={`input-field ${pw.confirm && pw.confirm!==pw.new ? 'border-red-400' : ''}`}
              value={pw.confirm} required onChange={e => setPw(p=>({...p,confirm:e.target.value}))} />
            {pw.confirm && pw.confirm!==pw.new && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
          </div>
          <SaveBtn loading={loading.pw} label="Change password" />
          <StatusMsg status={status.pw} />
        </form>
      </GlassCard>

      <GlassCard title="Data management">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Export your data</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Download all health logs as CSV</p>
            </div>
            <button onClick={exportData} disabled={loading.export} className="btn-secondary gap-1.5 flex-shrink-0 text-xs py-1.5 px-3">
              {loading.export
                ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"/>
                : <Download size={13}/>}
              Export CSV
            </button>
          </div>

          <div className="rounded-xl p-4" style={{ border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.05)' }}>
            <div className="flex items-center gap-2 mb-2">
              <GlowIcon icon={AlertTriangle} color="red" size="xs" />
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Permanently deletes your account and all health data. This cannot be undone.
            </p>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium">
                Delete my account →
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Enter your password to confirm:</p>
                <input type="password" className="input-field text-sm" placeholder="Your password"
                  value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); setS('delete',null) }}
                    className="btn-secondary text-xs py-1.5 px-3 flex-1">Cancel</button>
                  <button onClick={deleteAccount} disabled={loading.delete}
                    className="btn-danger text-xs py-1.5 px-3 flex-1 gap-1">
                    {loading.delete ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Trash2 size={12}/>}
                    Delete account
                  </button>
                </div>
                <StatusMsg status={status.delete} />
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function PreferencesSection({ user, updateUser }) {
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState({ units:false, lang:false })
  const [status, setStatus] = useState({ units:null,  lang:null  })

  const saveUnits = async (units) => {
    setSaving(p=>({...p,units:true}))
    try {
      const { data } = await authApi.updatePreferences({ units })
      updateUser({ preferences:{ ...user.preferences, units:data.user.preferences.units } })
      setStatus(p=>({...p,units:{type:'success',msg:`Switched to ${units}`}}))
      setTimeout(() => setStatus(p=>({...p,units:null})), 2000)
    } catch { setStatus(p=>({...p,units:{type:'error',msg:'Failed to save'}})) }
    finally { setSaving(p=>({...p,units:false})) }
  }

  const saveLang = async (language) => {
    setSaving(p=>({...p,lang:true}))
    try {
      const { data } = await authApi.updatePreferences({ language })
      updateUser({ preferences:{ ...user.preferences, language:data.user.preferences.language } })
      setStatus(p=>({...p,lang:{type:'success',msg:'Language saved'}}))
      setTimeout(() => setStatus(p=>({...p,lang:null})), 2000)
    } catch { setStatus(p=>({...p,lang:{type:'error',msg:'Failed to save'}})) }
    finally { setSaving(p=>({...p,lang:false})) }
  }

  const units = user?.preferences?.units   || 'metric'
  const lang  = user?.preferences?.language || 'en'

  const UNIT_OPTIONS = [
    { id:'metric',   label:'Metric',   sub:'kg · cm · ml',     icon:Ruler,  color:'indigo' },
    { id:'imperial', label:'Imperial', sub:'lbs · ft · fl oz', icon:Globe,  color:'amber'  },
  ]

  const THEMES = [
    { id:'light',  label:'Light',  icon:Sun,     desc:'Always light' },
    { id:'dark',   label:'Dark',   icon:Moon,    desc:'Always dark'  },
    { id:'system', label:'System', icon:Monitor, desc:'Follow OS'    },
  ]

  return (
    <div className="space-y-4">
      {/* Units */}
      <GlassCard title="Units of measurement">
        <div className="grid grid-cols-2 gap-3">
          {UNIT_OPTIONS.map(opt => (
            <button key={opt.id} type="button" onClick={() => saveUnits(opt.id)}
              disabled={saving.units}
              className="p-4 rounded-xl text-left transition-all duration-200"
              style={{
                background: units===opt.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.08)',
                border: `2px solid ${units===opt.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: units===opt.id ? '0 0 14px rgba(99,102,241,0.15)' : 'none',
              }}>
              <GlowIcon icon={opt.icon} color={opt.color} size="sm" className="mb-2" />
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{opt.label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{opt.sub}</div>
              {units===opt.id && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  <Check size={12}/>Active
                </div>
              )}
            </button>
          ))}
        </div>
        <StatusMsg status={status.units} />
      </GlassCard>

      {/* Language */}
      <GlassCard title="Language">
        <div className="space-y-2">
          {LANGUAGES.map(l => (
            <button key={l.code} type="button"
              onClick={() => l.available && saveLang(l.code)}
              disabled={!l.available || saving.lang}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${!l.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                background: lang===l.code && l.available ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${lang===l.code && l.available ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.1)'}`,
              }}>
              <div className="flex items-center gap-3">
                <GlowIcon icon={Globe} color="cyan" size="xs" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{l.label}</span>
                {!l.available && (
                  <span className="text-xs text-gray-400 px-2 py-0.5 rounded-full"
                    style={{ background:'rgba(0,0,0,0.06)' }}>Coming soon</span>
                )}
              </div>
              {lang===l.code && l.available && <Check size={15} className="text-indigo-500"/>}
            </button>
          ))}
        </div>
        <StatusMsg status={status.lang} />
      </GlassCard>

      {/* Theme */}
      <GlassCard title="Display theme">
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, icon:Icon, desc }) => (
            <button key={id} type="button" onClick={() => setTheme(id)}
              className="p-4 rounded-xl text-center transition-all duration-150"
              style={{
                background: theme===id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${theme===id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: theme===id ? '0 0 14px rgba(99,102,241,0.15)' : 'none',
              }}>
              <GlowIcon icon={Icon} color={theme===id ? 'indigo' : 'teal'} size="sm" className="mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function GoalsSection({ user, updateUser }) {
  const [daily,   setDaily]   = useState({
    dailySteps:     user?.goals?.dailySteps     || '',
    dailySleepHours:user?.goals?.dailySleepHours|| '',
    dailyWaterMl:   user?.goals?.dailyWaterMl   || '',
    targetMood:     user?.goals?.targetMood     || null,
  })
  const [longterm, setLongterm] = useState({ targetWeight: user?.goals?.targetWeight || '' })
  const [loading,  setLoading]  = useState({ daily:false, longterm:false })
  const [status,   setStatus]   = useState({ daily:null,  longterm:null  })

  const saveDaily = async (e) => {
    e.preventDefault(); setLoading(p=>({...p,daily:true})); setStatus(p=>({...p,daily:null}))
    try {
      const payload = {}
      if (daily.dailySteps      !== '') payload.dailySteps      = Number(daily.dailySteps)
      if (daily.dailySleepHours !== '') payload.dailySleepHours = Number(daily.dailySleepHours)
      if (daily.dailyWaterMl    !== '') payload.dailyWaterMl    = Number(daily.dailyWaterMl)
      if (daily.targetMood)             payload.targetMood      = daily.targetMood
      const { data } = await authApi.updateGoals(payload)
      updateUser({ goals:data.user.goals })
      setStatus(p=>({...p,daily:{type:'success',msg:'Daily targets saved!'}}))
    } catch (err) {
      setStatus(p=>({...p,daily:{type:'error',msg:err.response?.data?.error||'Failed to save'}}))
    } finally { setLoading(p=>({...p,daily:false})) }
  }

  const saveLongterm = async (e) => {
    e.preventDefault(); setLoading(p=>({...p,longterm:true})); setStatus(p=>({...p,longterm:null}))
    try {
      const payload = {}
      if (longterm.targetWeight !== '') payload.targetWeight = Number(longterm.targetWeight)
      const { data } = await authApi.updateGoals(payload)
      updateUser({ goals:data.user.goals })
      setStatus(p=>({...p,longterm:{type:'success',msg:'Objectives saved!'}}))
    } catch (err) {
      setStatus(p=>({...p,longterm:{type:'error',msg:err.response?.data?.error||'Failed to save'}}))
    } finally { setLoading(p=>({...p,longterm:false})) }
  }

  const DAILY_FIELDS = [
    { key:'dailySteps',      icon:Footprints, color:'indigo', label:'Daily steps goal',         hint:'steps', min:0,  max:100000, step:500,  presets:[5000,7500,10000,12000], fmtPreset:v=>`${(v/1000).toFixed(v%1000?1:0)}k`, pColor:'indigo' },
    { key:'dailySleepHours', icon:Moon,       color:'purple', label:'Daily sleep goal',          hint:'hours', min:0,  max:24,     step:0.5,  presets:[6,7,8,9],              fmtPreset:v=>`${v}h`,                              pColor:'purple' },
    { key:'dailyWaterMl',    icon:Droplets,   color:'cyan',   label:'Daily water goal',          hint:'ml',    min:0,  max:20000,  step:250,  presets:[1500,2000,2500,3000],  fmtPreset:v=>v>=1000?`${v/1000}L`:`${v}ml`,       pColor:'cyan'   },
  ]

  const MOOD_OPTS = [
    { v:1, icon:Frown,    color:'red'    },
    { v:2, icon:Meh,      color:'amber'  },
    { v:3, icon:Smile,    color:'cyan'   },
    { v:4, icon:SmilePlus,color:'green'  },
    { v:5, icon:Laugh,    color:'violet' },
  ]
  const MOOD_NAMES = ['','Very bad','Bad','Okay','Good','Great']

  return (
    <div className="space-y-4">
      <GlassCard title="Daily targets" description="Goals shown on your dashboard each day">
        <form onSubmit={saveDaily} className="space-y-6">

          {DAILY_FIELDS.map(({ key, icon, color, label, hint, min, max, step, presets, fmtPreset, pColor }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-1.5">
                <GlowIcon icon={icon} color={color} size="xs" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <span className="text-xs text-gray-400 dark:text-gray-500">({hint})</span>
              </div>
              <input type="number" className="input-field mb-2"
                value={daily[key]} min={min} max={max} step={step}
                placeholder={`e.g. ${presets[1]}`}
                onChange={e => setDaily(p=>({...p,[key]:e.target.value}))} />
              <div className="flex gap-1.5 flex-wrap">
                {presets.map(v => (
                  <button key={v} type="button"
                    onClick={() => setDaily(p=>({...p,[key]:v}))}
                    className="text-xs px-2.5 py-1 rounded-full border transition-all"
                    style={String(daily[key])===String(v)
                      ? { background:'#6366f1', color:'#fff', border:'1px solid #6366f1', boxShadow:'0 0 8px rgba(99,102,241,0.4)' }
                      : { background:'rgba(255,255,255,0.1)', color:'inherit', border:'1px solid rgba(255,255,255,0.15)' }
                    }>
                    {fmtPreset(v)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Mood target */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GlowIcon icon={Smile} color="green" size="xs" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mood target</label>
            </div>
            <div className="flex gap-2">
              {MOOD_OPTS.map(({ v, icon: MoodIc, color }) => {
                const active = daily.targetMood === v
                return (
                  <button key={v} type="button"
                    onClick={() => setDaily(p=>({...p,targetMood:p.targetMood===v?null:v}))}
                    className="flex-1 flex items-center justify-center py-3 rounded-xl transition-all duration-200"
                    style={{
                      background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `2px solid ${active ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                    }}>
                    <GlowIcon icon={MoodIc} color={color} size="sm" active={active} />
                  </button>
                )
              })}
            </div>
            {daily.targetMood && (
              <p className="text-xs text-green-600 dark:text-green-400 text-center mt-2 font-medium">
                Target: {MOOD_NAMES[daily.targetMood]}
              </p>
            )}
          </div>

          <SaveBtn loading={loading.daily} label="Save daily targets" />
          <StatusMsg status={status.daily} />
        </form>
      </GlassCard>

      <GlassCard title="Long-term objectives">
        <form onSubmit={saveLongterm} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <GlowIcon icon={Scale} color="amber" size="xs" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target weight (kg)</label>
            </div>
            <input type="number" className="input-field" value={longterm.targetWeight}
              min={1} max={500} step={0.1} placeholder="e.g. 65.0"
              onChange={e => setLongterm(p=>({...p,targetWeight:e.target.value}))} />
            {user?.goals?.targetWeight && user?.height && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Target BMI: {(user.goals.targetWeight / Math.pow(user.height/100, 2)).toFixed(1)}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl flex items-start gap-2.5"
            style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)' }}>
            <GlowIcon icon={Lightbulb} color="indigo" size="xs" className="flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              Set your height in the Profile section to see target BMI alongside this goal.
            </p>
          </div>

          <SaveBtn loading={loading.longterm} label="Save objectives" />
          <StatusMsg status={status.longterm} />
        </form>
      </GlassCard>
    </div>
  )
}

function AboutSection() {
  const STACK = [
    { label:'Frontend', items:'React 18, Vite, Tailwind CSS, Recharts'     },
    { label:'Backend',  items:'Node.js, Express.js, Socket.io'              },
    { label:'Database', items:'MongoDB Atlas, Mongoose'                     },
    { label:'Auth',     items:'JWT, bcrypt'                                 },
    { label:'AI',       items:'Groq (LLaMA 3 8B)'                          },
    { label:'DevOps',   items:'Docker, GitHub Actions, Render, Vercel'      },
  ]

  const TIPS = [
    { icon:CalendarDays, color:'indigo', text:'Log daily to build your streak and unlock AI insights'              },
    { icon:Target,       color:'green',  text:'Set goals in this page to see progress bars on your dashboard'      },
    { icon:BarChart2,    color:'violet', text:'Switch between metrics using the pills on the trend chart'           },
    { icon:Download,     color:'cyan',   text:'Export your data anytime from Account → Data Management'            },
    { icon:Moon,         color:'purple', text:'Enable dark mode or use System to follow your device preference'    },
    { icon:Smartphone,   color:'teal',   text:'Install the app on your phone from your browser menu'               },
  ]

  return (
    <div className="space-y-4">
      <GlassCard title="App information">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 8px 24px rgba(99,102,241,0.4)' }}>
            <Heart className="w-7 h-7 text-white" fill="white" style={{ filter:'drop-shadow(0 0 6px rgba(255,255,255,0.5))' }} />
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-lg">HealthTrack</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Version 1.0.0</div>
            <div className="text-xs text-indigo-500 mt-0.5">Modern Application Development — Assignment Project</div>
          </div>
        </div>
        <div className="space-y-2">
          {STACK.map(({ label, items }) => (
            <div key={label} className="flex gap-3 py-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-20 flex-shrink-0 pt-0.5">{label}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{items}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Quick tips">
        <div className="space-y-4">
          {TIPS.map(({ icon, color, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <GlowIcon icon={icon} color={color} size="sm" className="flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Support">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          HealthTrack is an open-source assignment project. For issues or suggestions, open a GitHub issue on the repository.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label:'GitHub Repository', href:'https://github.com'               },
            { label:'Groq Console',       href:'https://console.groq.com'         },
            { label:'MongoDB Atlas',      href:'https://cloud.mongodb.com'        },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <ChevronRight size={12}/>{label}
            </a>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [active, setActive]  = useState('profile')

  const content = {
    profile:     <ProfileSection     user={user} updateUser={updateUser} />,
    account:     <AccountSection     user={user} updateUser={updateUser} />,
    preferences: <PreferencesSection user={user} updateUser={updateUser} />,
    goals:       <GoalsSection       user={user} updateUser={updateUser} />,
    about:       <AboutSection />,
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Manage your profile, preferences and health goals
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Desktop sidebar nav */}
        <aside className="hidden lg:block w-44 flex-shrink-0 sticky top-6">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon:Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={active===id ? {
                  background:'rgba(99,102,241,0.11)',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)',
                  color: undefined,
                } : undefined}
              >
                <Icon size={16} className={active===id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500'} />
                <span className={active===id
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400'}>
                  {label}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile tab scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {SECTIONS.map(({ id, label, icon:Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
                style={active===id
                  ? { background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', boxShadow:'0 0 10px rgba(99,102,241,0.4)' }
                  : { background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'inherit' }
                }>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
          {content[active]}
        </div>
      </div>
    </Layout>
  )
}