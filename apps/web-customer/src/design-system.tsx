import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"

/* ReFix Design System — tokens live in index.css (:root, .glass, .grad-*) */

export type Tone = "glass" | "pearl" | "ink" | "sage" | "lilac" | "sand"
const toneCls: Record<Tone, string> = {
  glass: "glass",
  pearl: "grad-pearl",
  ink: "grad-ink",
  sage: "grad-sage",
  lilac: "grad-lilac",
  sand: "grad-sand",
}

export function Card({ tone = "glass", className = "", onClick, children }: { tone?: Tone; className?: string; onClick?: () => void; children: ReactNode }) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={e => onClick && e.key === "Enter" && onClick()}
      className={`${toneCls[tone]} rounded-[28px] p-5 ${onClick ? "cursor-pointer active:scale-[0.99] transition" : ""} ${className}`}
    >
      {children}
    </div>
  )
}

type BtnVariant = "primary" | "secondary" | "ghost"
export function Button({ variant = "primary", icon, className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: ReactNode }) {
  const v =
    variant === "primary"
      ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm"
      : variant === "secondary"
        ? "glass-strong text-[var(--ink)]"
        : "bg-transparent text-[var(--ink)] border border-[var(--line)]"
  return (
    <button {...rest} className={`min-h-14 px-5 sm:px-6 py-2 min-w-0 rounded-full font-semibold text-[15px] leading-tight text-center flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-40 cursor-pointer ${v} ${className}`}>
      {children}
      {icon}
    </button>
  )
}

export function IconButton({ label, children, onClick, dark }: { label: string; children: ReactNode; onClick?: () => void; dark?: boolean }) {
  return (
    <button aria-label={label} onClick={onClick} className={`w-11 h-11 rounded-full grid place-items-center shrink-0 cursor-pointer active:scale-95 transition ${dark ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm" : "glass-strong text-[var(--ink)]"}`}>
      {children}
    </button>
  )
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`h-10 px-4 rounded-full text-sm font-medium shrink-0 whitespace-nowrap transition cursor-pointer ${active ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm" : "glass-strong text-[var(--ink)]"}`}>
      {children}
    </button>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="glass rounded-full p-1 flex">
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={`flex-1 h-10 rounded-full text-sm font-semibold transition cursor-pointer ${value === k ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm" : "text-[var(--muted)]"}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full h-14 px-5 rounded-full glass-strong outline-none text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ""}`} />
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-[13px] text-[var(--muted)] font-medium">{children}</div>
}

export function SectionTitle({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-[17px] font-bold">{children}</div>
      {action && <button onClick={onAction} className="text-sm text-[var(--accent)] font-semibold cursor-pointer">{action}</button>}
    </div>
  )
}

export function ListRow({ title, sub, right, onClick, icon }: { title: string; sub?: string; right?: ReactNode; onClick?: () => void; icon?: ReactNode }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key === "Enter" && onClick?.()} className="flex items-center gap-4 py-4 cursor-pointer">
      {icon && <div className="w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 grid place-items-center shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] line-clamp-2">{title}</div>
        {sub && <div className="text-[13px] text-[var(--muted)] mt-0.5 truncate">{sub}</div>}
      </div>
      {right ?? <Chevron />}
    </div>
  )
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-[#e3e7c4] via-[#c9c7ef] to-[var(--accent)] transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warn" | "accent" }) {
  const t = tone === "success" ? "bg-[#dcebe2] dark:bg-[#1a3829] text-[var(--success)]" : tone === "warn" ? "bg-[#f3e6cf] dark:bg-[#3d2e15] text-[var(--warn)]" : tone === "accent" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "bg-white/70 dark:bg-white/10 text-[var(--muted)]"
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 tabular-nums ${t}`}>{children}</span>
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button aria-pressed={on} onClick={() => onChange(!on)} className={`w-12 h-7 rounded-full p-1 transition cursor-pointer ${on ? "bg-[var(--accent)]" : "bg-black/10 dark:bg-white/20"}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : ""}`} />
    </button>
  )
}

/* Minimal stroke icon set */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
export const Icon = {
  back: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M15 18l-6-6 6-6" /></svg>,
  bell: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0" /></svg>,
  search: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  spark: () => <svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>,
  pin: () => <svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>,
  box: () => <svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" /></svg>,
  book: () => <svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16" /></svg>,
  user: () => <svg width="22" height="22" viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>,
  send: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  plus: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M12 5v14M5 12h14" /></svg>,
  chat: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M21 12a8 8 0 01-11.8 7L4 20l1-4.6A8 8 0 1121 12z" /></svg>,
  phone: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>,
  check: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M5 12l5 5L20 7" /></svg>,
  star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>,
  map: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" /></svg>,
  list: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  clip: () => <svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7" /></svg>,
  heart: () => <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>,
}
export function Chevron() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...P} className="text-[var(--muted)] shrink-0"><path d="M9 6l6 6-6 6" /></svg>
}

/* Rotating circular stamp — brand accent placed in screen headers */
export function RotatingStamp({ text, onClick, children, tone = "pearl" }: { text: string; onClick?: () => void; children: ReactNode; tone?: "pearl" | "ink" | "lilac" | "sage" }) {
  const id = `stamp-${text.replace(/\W/g, "")}`
  const bg = tone === "ink" ? "grad-ink" : tone === "lilac" ? "grad-lilac" : tone === "sage" ? "grad-sage" : "grad-pearl"
  return (
    <button aria-label={text} onClick={onClick} className={`relative w-[88px] h-[88px] rounded-full ${bg} shrink-0 cursor-pointer active:scale-95 transition shadow-[0_8px_24px_rgba(40,45,80,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full stamp-spin">
        <defs><path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" /></defs>
        <text className="fill-current" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em" }}>
          <textPath href={`#${id}`}>{`${text} • ${text} • `.toUpperCase()}</textPath>
        </text>
      </svg>
      <span className={`absolute inset-[26px] rounded-full grid place-items-center ${tone === "ink" ? "bg-white/15 dark:bg-white/10" : "bg-white/70 dark:bg-black/40"}`}>{children}</span>
    </button>
  )
}

/* ReFix logo — an open ring closed by a single "stitch" point:
   the device lifecycle loop that ReFix completes. */
export function LogoMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const c = light ? "#ffffff" : "var(--ink)"
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3e7c4" />
          <stop offset="0.55" stopColor="#c9c7ef" />
          <stop offset="1" stopColor="#3f4a8a" />
        </linearGradient>
      </defs>
      <path d="M38.5 15.5A17 17 0 1 0 41 24" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <circle cx="40.6" cy="19.2" r="4.2" fill="url(#lm-g)" />
      <circle cx="24" cy="24" r="5" fill="url(#lm-g)" />
    </svg>
  )
}

export function Logo({ light = false, size = 28 }: { light?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} light={light} />
      <span className={`font-extrabold tracking-tight ${light ? "text-white" : ""}`} style={{ fontSize: size * 0.68 }}>refix</span>
    </div>
  )
}
