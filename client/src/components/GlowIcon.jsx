import { useTheme } from '../context/ThemeContext'
import { Frown, Meh, Smile, SmilePlus, Star } from 'lucide-react'

const COLORS = {
  indigo: { bg:'rgba(99,102,241,0.13)',  border:'rgba(99,102,241,0.22)',  icon:'#6366f1', glow:'rgba(99,102,241,0.32)',  dBg:'rgba(99,102,241,0.22)',  dBorder:'rgba(99,102,241,0.42)', dIcon:'#818cf8', dGlow:'rgba(99,102,241,0.58)' },
  purple: { bg:'rgba(139,92,246,0.12)',  border:'rgba(139,92,246,0.2)',   icon:'#8b5cf6', glow:'rgba(139,92,246,0.3)',   dBg:'rgba(139,92,246,0.2)',   dBorder:'rgba(139,92,246,0.4)',  dIcon:'#a78bfa', dGlow:'rgba(139,92,246,0.55)' },
  violet: { bg:'rgba(124,58,237,0.12)',  border:'rgba(124,58,237,0.2)',   icon:'#7c3aed', glow:'rgba(124,58,237,0.3)',   dBg:'rgba(124,58,237,0.2)',   dBorder:'rgba(124,58,237,0.4)',  dIcon:'#a78bfa', dGlow:'rgba(124,58,237,0.55)' },
  cyan:   { bg:'rgba(6,182,212,0.1)',    border:'rgba(6,182,212,0.18)',   icon:'#0891b2', glow:'rgba(6,182,212,0.26)',   dBg:'rgba(6,182,212,0.18)',   dBorder:'rgba(6,182,212,0.35)',  dIcon:'#22d3ee', dGlow:'rgba(6,182,212,0.48)' },
  teal:   { bg:'rgba(20,184,166,0.1)',   border:'rgba(20,184,166,0.18)',  icon:'#0d9488', glow:'rgba(20,184,166,0.26)',  dBg:'rgba(20,184,166,0.18)',  dBorder:'rgba(20,184,166,0.35)', dIcon:'#2dd4bf', dGlow:'rgba(20,184,166,0.48)' },
  green:  { bg:'rgba(16,185,129,0.1)',   border:'rgba(16,185,129,0.18)',  icon:'#059669', glow:'rgba(16,185,129,0.26)',  dBg:'rgba(16,185,129,0.18)',  dBorder:'rgba(16,185,129,0.35)', dIcon:'#34d399', dGlow:'rgba(16,185,129,0.48)' },
  amber:  { bg:'rgba(245,158,11,0.1)',   border:'rgba(245,158,11,0.18)',  icon:'#d97706', glow:'rgba(245,158,11,0.28)',  dBg:'rgba(245,158,11,0.18)',  dBorder:'rgba(245,158,11,0.35)', dIcon:'#fbbf24', dGlow:'rgba(245,158,11,0.5)'  },
  orange: { bg:'rgba(249,115,22,0.1)',   border:'rgba(249,115,22,0.18)',  icon:'#ea580c', glow:'rgba(249,115,22,0.28)',  dBg:'rgba(249,115,22,0.18)',  dBorder:'rgba(249,115,22,0.38)', dIcon:'#fb923c', dGlow:'rgba(249,115,22,0.52)' },
  red:    { bg:'rgba(239,68,68,0.1)',    border:'rgba(239,68,68,0.18)',   icon:'#dc2626', glow:'rgba(239,68,68,0.26)',   dBg:'rgba(239,68,68,0.18)',   dBorder:'rgba(239,68,68,0.35)',  dIcon:'#f87171', dGlow:'rgba(239,68,68,0.5)'  },
  rose:   { bg:'rgba(244,63,94,0.1)',    border:'rgba(244,63,94,0.18)',   icon:'#e11d48', glow:'rgba(244,63,94,0.26)',   dBg:'rgba(244,63,94,0.18)',   dBorder:'rgba(244,63,94,0.35)',  dIcon:'#fb7185', dGlow:'rgba(244,63,94,0.5)'  },
  pink:   { bg:'rgba(236,72,153,0.1)',   border:'rgba(236,72,153,0.18)',  icon:'#db2777', glow:'rgba(236,72,153,0.26)',  dBg:'rgba(236,72,153,0.18)',  dBorder:'rgba(236,72,153,0.35)', dIcon:'#f472b6', dGlow:'rgba(236,72,153,0.5)' },
}

const SIZES = {
  xs: { c:24,  i:12, r:6,  s:4  },
  sm: { c:30,  i:14, r:8,  s:6  },
  md: { c:38,  i:18, r:10, s:9  },
  lg: { c:50,  i:23, r:13, s:12 },
  xl: { c:64,  i:29, r:17, s:16 },
}

export default function GlowIcon({
  icon: Icon,
  color = 'indigo',
  size = 'md',
  hoverable = false,
  active = false,
  className = '',
  style: extraStyle = {},
}) {
  const { dark } = useTheme()
  const cfg = COLORS[color] || COLORS.indigo
  const sz  = SIZES[size]  || SIZES.md
  const glowVal = dark ? cfg.dGlow : cfg.glow
  const glowMul = active ? 1.9 : 1

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center transition-all duration-200 ${hoverable ? 'hover:scale-[1.1]' : ''} ${className}`}
      style={{
        width:  sz.c,
        height: sz.c,
        borderRadius: sz.r,
        background: dark ? cfg.dBg : cfg.bg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${dark ? cfg.dBorder : cfg.border}`,
        boxShadow: [
          `0 0 ${sz.s * glowMul}px ${glowVal}`,
          `0 0 ${sz.s * 2.2 * glowMul}px ${glowVal.replace(/[\d.]+\)$/, v => String(parseFloat(v) * 0.4) + ')')}`,
          `inset 0 1px 0 rgba(255,255,255,${dark ? 0.09 : 0.52})`,
          `inset 0 -1px 0 rgba(0,0,0,${dark ? 0.12 : 0.03})`,
          `0 2px ${sz.s + 5}px rgba(0,0,0,${dark ? 0.3 : 0.07})`,
        ].join(', '),
        ...extraStyle,
      }}
    >
      <Icon
        size={sz.i}
        strokeWidth={2.1}
        style={{
          color: dark ? cfg.dIcon : cfg.icon,
          filter: `drop-shadow(0 0 ${sz.s * 0.55}px ${glowVal})`,
          transition: 'filter 0.2s ease, color 0.2s ease',
        }}
      />
    </div>
  )
}

const MOOD_ICON_MAP  = { 1: Frown, 2: Meh, 3: Smile, 4: SmilePlus, 5: Star }
const MOOD_COLOR_MAP = { 1: 'red', 2: 'amber', 3: 'cyan', 4: 'green', 5: 'violet' }

export function MoodIcon({ mood, size = 'sm', ...props }) {
  const Icon  = MOOD_ICON_MAP[mood]
  const color = MOOD_COLOR_MAP[mood]
  if (!Icon || !color) return null
  return <GlowIcon icon={Icon} color={color} size={size} {...props} />
}