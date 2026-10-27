import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button, Card, Chip, Field, Icon, IconButton, Label, LogoMark, Logo, Progress, Toggle, RotatingStamp } from "./design-system"
import { useI18n, type Language } from "./i18n"

export type UserProfile = { name: string; email: string; phone: string; lang: Language; type: "client" | "partner" }
type Step = "welcome" | "method" | "phone" | "code" | "details" | "consents" | "done" | "login"

export default function Onboarding({ onComplete }: { onComplete: (u: UserProfile) => void }) {
  const { lang, setLang, t } = useI18n()
  const o = t.onboarding

  const [step, setStep] = useState<Step>("welcome")
  const [history, setHistory] = useState<Step[]>([])
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState(["", "", "", ""])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState<"client" | "partner">("client")
  const [consents, setConsents] = useState({ terms: false, privacy: false, marketing: false })
  const [timer, setTimer] = useState(30)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const go = (s: Step) => { setHistory(h => [...h, step]); setStep(s) }
  const back = () => { const h = [...history]; const p = h.pop(); if (p) { setHistory(h); setStep(p) } }

  useEffect(() => {
    if (step !== "code" || timer === 0) return
    const interval = setTimeout(() => setTimer(timer - 1), 1000)
    return () => clearTimeout(interval)
  }, [step, timer])

  const flow: Step[] = ["phone", "code", "details", "consents"]
  const idx = flow.indexOf(step)
  const phoneOk = phone.replace(/\D/g, "").length === 9
  const codeOk = code.every(c => c)
  const detailsOk = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email)
  const consentsOk = consents.terms && consents.privacy
  const defaultName = lang === "PL" ? "Michał Kowalski" : lang === "UA" ? "Михайло Коваль" : lang === "RU" ? "Михаил Коваль" : "Michael Smith"
  const user: UserProfile = { name: name || defaultName, email: email || "michal.kowalski@mail.pl", phone, lang, type }

  if (step === "welcome") return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="min-h-full mx-auto w-full max-w-lg flex flex-col screen-in px-5 sm:px-8 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex gap-1 bg-white/40 dark:bg-black/20 p-1 rounded-full border border-white/40 dark:border-white/10">
            {(["PL", "EN", "UA", "RU"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  lang === l ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-10 py-6">
          <div className="relative mx-auto w-[min(14rem,60vw)] aspect-square grid place-items-center">
            <div className="absolute inset-0 rounded-full grad-pearl opacity-70 blur-2xl" />
            <div className="relative w-[78%] aspect-square rounded-full glass grid place-items-center"><LogoMark size={96} /></div>
            <div className="absolute -right-2 -bottom-2">
              <RotatingStamp text="Repair God · Express" tone="ink">
                <span className="text-white"><Icon.box /></span>
              </RotatingStamp>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-[clamp(1.9rem,1.3rem+2.4vw,2.75rem)] leading-[1.1] text-balance font-light tracking-tight">
              {o.tagline}
            </div>
            <div className="text-[15px] text-[var(--muted)] leading-relaxed">
              {o.subTagline}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={() => go("method")}>{o.createAccount}</Button>
          <Button variant="secondary" className="w-full" onClick={() => go("login")}>{o.haveAccount}</Button>
        </div>
      </div>
    </div>
  )

  if (step === "login") return (
    <Frame back={back} idx={idx} total={flow.length} backLabel={t.common.back} title={o.welcomeBack} sub={o.welcomeBackSub} cta={<Button className="w-full" disabled={!phoneOk} onClick={() => { setTimer(30); go("code") }}>{o.sendSmsCode}</Button>}>
      <PhoneInput phone={phone} setPhone={setPhone} />
    </Frame>
  )

  if (step === "method") return (
    <Frame back={back} idx={idx} total={flow.length} backLabel={t.common.back} title={o.regMethodTitle} sub={o.regMethodSub} cta={<div className="text-center text-[13px] text-[var(--muted)]">{o.termsNote}</div>}>
      <div className="space-y-3">
        <Card onClick={() => go("phone")} className="flex items-center gap-4 cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-white/70 dark:bg-white/10 grid place-items-center"><Icon.phone /></div>
          <div className="flex-1"><div className="font-bold">{o.phoneMethod}</div><Label>{o.phoneMethodSub}</Label></div>
        </Card>
        <Card onClick={() => { setEmail("user@gmail.com"); setName(defaultName); go("consents") }} className="flex items-center gap-4 cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-white/70 dark:bg-white/10 grid place-items-center font-bold">G</div>
          <div className="flex-1"><div className="font-bold">{o.googleMethod}</div><Label>{o.googleMethodSub}</Label></div>
        </Card>
        <Card onClick={() => { setEmail("user@icloud.com"); setName(defaultName); go("consents") }} className="flex items-center gap-4 cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-white/70 dark:bg-white/10 grid place-items-center font-bold"></div>
          <div className="flex-1"><div className="font-bold">{o.appleMethod}</div><Label>{o.appleMethodSub}</Label></div>
        </Card>
      </div>
    </Frame>
  )

  if (step === "phone") return (
    <Frame back={back} idx={idx} total={flow.length} backLabel={t.common.back} title={o.enterPhoneTitle} sub={o.enterPhoneSub} cta={<Button className="w-full" disabled={!phoneOk} onClick={() => { setTimer(30); go("code") }}>{o.sendSmsCode}</Button>}>
      <PhoneInput phone={phone} setPhone={setPhone} />
    </Frame>
  )

  if (step === "code") return (
    <Frame back={back} idx={idx} total={flow.length} backLabel={t.common.back} title={o.enterSmsTitle} sub={o.enterSmsSub(phone || "600 000 000")}
      cta={<>
        <Button className="w-full" disabled={!codeOk} onClick={() => history.includes("login") ? onComplete(user) : go("details")}>{t.common.confirm}</Button>
        <Button variant="ghost" className="w-full" disabled={timer > 0} onClick={() => { setCode(["", "", "", ""]); setTimer(30) }}>
          {timer > 0 ? o.resendIn(timer) : o.resendCode}
        </Button>
      </>}>
      <div className="flex gap-3 justify-between">
        {code.map((c, i) => (
          <input key={i} ref={el => { refs.current[i] = el }} value={c} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
            onChange={e => { const v = e.target.value.replace(/\D/g, ""); const n = [...code]; n[i] = v; setCode(n); if (v && i < 3) refs.current[i + 1]?.focus() }}
            onKeyDown={e => { if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus() }}
            className="w-full aspect-square max-w-20 rounded-3xl glass-strong text-center text-3xl font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/30" />
        ))}
      </div>
    </Frame>
  )

  if (step === "details") return (
    <Frame back={back} idx={idx} total={flow.length} backLabel={t.common.back} title={o.aboutYouTitle} sub={o.aboutYouSub} cta={<Button className="w-full" disabled={!detailsOk} onClick={() => go("consents")}>{t.common.confirm}</Button>}>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>{o.nameLabel}</Label>
          <Field value={name} onChange={e => setName(e.target.value)} placeholder={o.namePlaceholder} autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label>{o.emailLabel}</Label>
          <Field type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={o.emailPlaceholder} autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label>{o.accountTypeLabel}</Label>
          <div className="grid grid-cols-2 gap-3">
            {([["client", o.clientRole, o.clientRoleDesc], ["partner", o.partnerRole, o.partnerRoleDesc]] as const).map(([k, title, desc]) => (
              <Card key={k} tone={type === k ? "pearl" : "glass"} onClick={() => setType(k)} className={`p-4 cursor-pointer ${type === k ? "ring-2 ring-[var(--accent)]/30" : ""}`}>
                <div className="font-bold">{title}</div>
                <Label>{desc}</Label>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{o.appLangLabel}</Label>
          <div className="flex gap-2">
            {(["PL", "EN", "UA", "RU"] as const).map(l => (
              <Chip key={l} active={lang === l} onClick={() => setLang(l)}>{l}</Chip>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )

  if (step === "consents") {
    const Row = ({ k, text, req }: { k: keyof typeof consents; text: string; req?: boolean }) => (
      <div className="flex items-center gap-4 py-4">
        <div className="flex-1 text-[15px]">{text}{req && <span className="text-[var(--muted)]"> {o.required}</span>}</div>
        <Toggle on={consents[k]} onChange={v => setConsents({ ...consents, [k]: v })} />
      </div>
    )
    return (
      <Frame back={back} idx={idx} total={flow.length} backLabel={t.common.back} title={o.lastStepTitle} sub={o.lastStepSub}
        cta={<>
          <Button className="w-full" disabled={!consentsOk} onClick={() => go("done")}>{o.createAccountBtn}</Button>
          <Button variant="ghost" className="w-full" onClick={() => setConsents({ terms: true, privacy: true, marketing: true })}>{o.checkAll}</Button>
        </>}>
        <Card className="py-1 divide-y divide-[var(--line)]">
          <Row k="terms" text={o.termsConsent} req />
          <Row k="privacy" text={o.privacyConsent} req />
          <Row k="marketing" text={o.marketingConsent} />
        </Card>
      </Frame>
    )
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="min-h-full mx-auto w-full max-w-lg flex flex-col screen-in px-5 sm:px-8 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="relative w-36 h-36 rounded-full glass grid place-items-center"><LogoMark size={72} /></div>
          <div className="text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] font-light leading-tight">
            {o.welcomeDoneTitle(user.name.split(" ")[0] ?? "")}
          </div>
          <div className="text-[15px] text-[var(--muted)] max-w-xs">
            {type === "partner" ? o.welcomeDonePartner : o.welcomeDoneClient}
          </div>
        </div>
        <div className="space-y-3">
          <Button className="w-full" onClick={() => onComplete(user)}>{o.startDiagBtn}</Button>
        </div>
      </div>
    </div>
  )
}

function PhoneInput({ phone, setPhone }: { phone: string; setPhone: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <div className="h-14 px-4 sm:px-5 shrink-0 whitespace-nowrap rounded-full glass-strong grid place-items-center font-semibold">🇵🇱 +48</div>
      <Field inputMode="tel" autoFocus value={phone} placeholder="600 000 000" onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9).replace(/(\d{3})(?=\d)/g, "$1 "))} />
    </div>
  )
}

function Frame({ title, sub, children, cta, back, backLabel, idx, total }: { title: ReactNode; sub?: string; children?: ReactNode; cta: ReactNode; back: () => void; backLabel: string; idx: number; total: number }) {
  return (
    <div className="h-full flex flex-col screen-in pt-[env(safe-area-inset-top)]">
      <header className="mx-auto w-full max-w-lg flex items-center gap-4 px-5 sm:px-8 pt-2 md:pt-4 pb-2">
        <IconButton label={backLabel} onClick={back}><Icon.back /></IconButton>
        {idx >= 0 && <div className="flex-1"><Progress value={((idx + 1) / total) * 100} /></div>}
        {idx >= 0 && <span className="text-[13px] text-[var(--muted)] font-semibold">{idx + 1}/{total}</span>}
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="mx-auto w-full max-w-lg px-5 sm:px-8 pt-6 pb-6 space-y-8">
          <div className="space-y-3">
            <div className="text-[clamp(1.75rem,1.2rem+2.2vw,2.5rem)] leading-tight font-light tracking-tight">{title}</div>
            {sub && <div className="text-[15px] text-[var(--muted)] leading-relaxed">{sub}</div>}
          </div>
          {children}
        </div>
      </div>
      <div className="shrink-0 mx-auto w-full max-w-lg px-5 sm:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 space-y-3">{cta}</div>
    </div>
  )
}
