import { useState, useEffect, useRef, type ReactNode } from "react"
import Onboarding, { type UserProfile } from "./Onboarding"
import { Logo, Badge, Button, RotatingStamp, Card, Chip, Field, Icon, IconButton, Label, ListRow, Progress, SectionTitle, Segmented, Toggle } from "./design-system"
import { SERVICES, type Service } from "./data/mock"
import { I18nProvider, useI18n, type Language } from "./i18n"
import GoogleMapView from "./components/GoogleMapView"
import { askGeminiDiagnostic, type ChatMessage, type DiagnosticResult } from "./services/aiDiagnosis"

/* ─── Routing: simple stack navigator ─── */
type Tab = "diag" | "services" | "orders" | "knowledge" | "profile"
type Route =
  | { name: "tab" }
  | { name: "service"; id: number }
  | { name: "checkout"; id: number; item: number }
  | { name: "success" }
  | { name: "chat"; id: number }
  | { name: "call"; id: number }
  | { name: "post"; id: number }
  | { name: "newPost" }
  | { name: "notifications" }
  | { name: "subscription" }
  | { name: "referral" }
  | { name: "history" }
  | { name: "historyItem"; id: string }
  | { name: "settings" }
  | { name: "faq" }
  | { name: "support" }
  | { name: "accounts" }
  | { name: "label" }

type Order = {
  service: Service
  item: string
  price: number
  total: number
  step: number
  delivery: string
  ret: string
  pay: string
  extra?: "pending" | "accepted" | "declined"
}

type Nav = { push: (r: Route) => void; back: () => void; tab: (t: Tab) => void }

const svc = (id: number) => SERVICES.find(s => s.id === id)!

/* ─── Layout primitives ─── */
function Screen({ title, nav, right, children, footer, wide }: { title?: string; nav?: Nav; right?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const { t } = useI18n()
  const box = `mx-auto w-full min-w-0 ${wide ? "max-w-7xl" : "max-w-3xl"} px-5 sm:px-8 lg:px-12`
  return (
    <div className="screen-root h-full flex flex-col screen-in pt-[env(safe-area-inset-top)]">
      {(title || nav) ? (
        <header className={`${box} flex items-center gap-3 pt-3 md:pt-6 pb-2`}>
          {nav && <IconButton label={t.common.back} onClick={nav.back}><Icon.back /></IconButton>}
          <div className="flex-1 text-[17px] font-bold truncate">{title}</div>
          {right}
        </header>
      ) : null}
      <div className="scroll-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar"><div className={`${box} pt-2 md:pt-4 pb-8 md:pb-12 space-y-6 md:space-y-8`}>{children}</div></div>
      {footer && <div className="screen-footer shrink-0 px-3 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><div className="mx-auto w-full max-w-xl min-w-0 px-2">{footer}</div></div>}
    </div>
  )
}

function Hero({ eyebrow, title, right }: { eyebrow: string; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 pt-2">
      <div className="min-w-0">
        <Label>{eyebrow}</Label>
        <div className="text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)] leading-tight font-light tracking-tight mt-1 text-balance">{title}</div>
      </div>
      {right}
    </div>
  )
}

/* ─── 01 Diagnostyka ─── */
function Diagnosis({ nav, userName }: { nav: Nav; userName: string }) {
  const { t, lang } = useI18n()
  const d = t.diagnosis
  const [msgs, setMsgs] = useState<ChatMessage[]>([{ ai: true, t: d.initialAiMsg }])
  const [input, setInput] = useState("")
  const [stage, setStage] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAttachedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const send = async (text: string, directImage?: string) => {
    const imgToSend = directImage || attachedImage
    if ((!text.trim() && !imgToSend) || isTyping) return

    const userText = text.trim() || (imgToSend ? "Załączono zdjęcie urządzenia" : "")
    const newMsg: ChatMessage = {
      ai: false,
      t: userText,
      image: imgToSend || undefined
    }

    const updated = [...msgs, newMsg]
    setMsgs(updated)
    setInput("")
    setAttachedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsTyping(true)

    try {
      const { reply, result } = await askGeminiDiagnostic(updated, userName, lang)
      setMsgs(m => [...m, { ai: true, t: reply }])
      if (result) {
        setDiagnosticResult(result)
      }
      setStage(s => s + 1)
    } catch (e) {
      console.warn("Diagnosis failed:", e)
      setMsgs(m => [...m, { ai: true, t: stage === 0 ? d.followupAiMsg : d.resultAiMsg }])
      setStage(s => s + 1)
    } finally {
      setIsTyping(false)
    }
  }

  const chips = [d.screenCrackedChip, d.notChargingChip, d.fastDrainChip, d.liquidDamageChip]

  return (
    <Screen
      footer={
        <div className="space-y-3">
          {/* Hidden native file input for camera/gallery upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {stage === 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {chips.map(c => <Chip key={c} onClick={() => send(c)}>{c}</Chip>)}
            </div>
          )}

          {/* Attached image preview banner */}
          {attachedImage && (
            <div className="flex items-center gap-3 p-2 rounded-2xl glass-strong border border-white/20">
              <img src={attachedImage} alt="Załącznik" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-[var(--ink)]">Zdjęcie dołączone</div>
                <div className="text-[var(--muted)]">Gemini AI przeanalizuje usterkę ze zdjęcia</div>
              </div>
              <button
                onClick={() => { setAttachedImage(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 grid place-items-center text-sm font-bold cursor-pointer hover:bg-black/20"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <IconButton
              label="Attach file/photo"
              onClick={() => fileInputRef.current?.click()}
              className={attachedImage ? "ring-2 ring-[var(--accent)]" : ""}
            >
              <Icon.clip />
            </IconButton>
            <Field
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder={attachedImage ? "Opisz zdjęcie lub kliknij Wyślij…" : d.inputPlaceholder}
              className="h-11"
            />
            <IconButton
              label={t.common.send}
              dark
              disabled={isTyping || (!input.trim() && !attachedImage)}
              onClick={() => send(input)}
            >
              <Icon.send />
            </IconButton>
          </div>
        </div>
      }
    >
      <div className="flex items-center justify-between">
        <Logo size={26} />
        <div className="flex gap-2">
          <IconButton label={t.common.search} onClick={() => nav.tab("services")}><Icon.search /></IconButton>
          <IconButton label={t.common.notifications} onClick={() => nav.push({ name: "notifications" })}><Icon.bell /></IconButton>
        </div>
      </div>
      <Hero eyebrow={d.greeting(userName)} title={<>{d.whatBroken} <span className="font-bold">{d.brokenAccent}</span></>} right={<RotatingStamp text={d.aiStamp} onClick={() => send(d.screenCrackedChip)}><Icon.spark /></RotatingStamp>} />
      <Card tone="pearl" className="flex items-center justify-between">
        <div>
          <Label>{d.aiAssistant}</Label>
          <div className="text-lg font-bold mt-1">{d.diagIn2Min}</div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/70 dark:bg-white/10 grid place-items-center"><Icon.spark /></div>
      </Card>
      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[min(85%,36rem)] px-5 break-words py-3.5 rounded-3xl text-[15px] leading-relaxed ${m.ai ? "glass" : "bg-[var(--bubble-user-bg)] text-[var(--bubble-user-text)] ml-auto shadow-sm"}`}>
            {m.image && (
              <img src={m.image} alt="Załączone zdjęcie" className="rounded-2xl max-h-56 w-auto object-cover mb-2 border border-white/10 shadow" />
            )}
            <div>{m.t}</div>
          </div>
        ))}
        {isTyping && (
          <div className="max-w-[min(85%,36rem)] px-5 py-3.5 rounded-3xl text-[15px] glass flex items-center gap-2 text-[var(--muted)] screen-in">
            <span className="text-xs font-semibold">Gemini AI analizuje…</span>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {(diagnosticResult || stage >= 2) && (
        <Card tone="glass" className="space-y-4 screen-in">
          <div className="flex items-center justify-between">
            <Label>{d.diagResultLabel}</Label>
            <Badge tone="accent">{diagnosticResult?.confidence || d.confidenceBadge}</Badge>
          </div>
          <div className="text-xl font-bold">{diagnosticResult?.title || d.displayReplacement}</div>
          <div className="grid grid-cols-3 gap-3 md:gap-6 num-grid">
            <div><Label>{t.tabs.services}</Label><div className="font-bold text-lg">{diagnosticResult?.servicesCount || d.servicesCount}</div></div>
            <div><Label>{t.common.from}</Label><div className="font-bold text-lg">{diagnosticResult?.priceFrom || d.priceFrom}</div></div>
            <div><Label>{d.timeEst}</Label><div className="font-bold text-lg">{diagnosticResult?.days || `1–3 ${t.common.days}`}</div></div>
          </div>
          <Button className="w-full" onClick={() => nav.tab("services")} icon={<Icon.send />}>{d.selectServiceBtn}</Button>
        </Card>
      )}
    </Screen>
  )
}

/* ─── 02 Serwisy ─── */
function ServicesScreen({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const sLoc = t.services
  const [sort, setSort] = useState<"dist" | "price" | "days" | "rating">("dist")
  const [view, setView] = useState<"list" | "map">("list")
  const [q, setQ] = useState("")

  const list = SERVICES.filter(s => (s.name + s.spec).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0) || (sort === "rating" ? b.rating - a.rating : a[sort] - b[sort]))

  const map = (
    <GoogleMapView
      services={list}
      onSelectService={id => nav.push({ name: "service", id })}
    />
  )

  return (
    <Screen wide>
      <Hero eyebrow={sLoc.eyebrow} title={<>{sLoc.nearTitle} <span className="font-bold">{sLoc.nearAccent}</span></>} right={<div className="lg:hidden"><RotatingStamp text={view === "map" ? sLoc.listStamp : sLoc.mapStamp} tone="sage" onClick={() => setView(view === "map" ? "list" : "map")}>{view === "map" ? <Icon.list /> : <Icon.map />}</RotatingStamp></div>} />
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] items-start">
        <div className="min-w-0 space-y-5">
          <Field value={q} onChange={e => setQ(e.target.value)} placeholder={sLoc.searchPlaceholder} />
          <div className="lg:hidden"><Segmented value={view} onChange={setView} options={[["list", sLoc.listView], ["map", sLoc.mapView]]} /></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
            {([["dist", sLoc.sortNear], ["price", sLoc.sortCheap], ["days", sLoc.sortFast], ["rating", sLoc.sortRating]] as const).map(([k, l]) => <Chip key={k} active={sort === k} onClick={() => setSort(k)}>{l}</Chip>)}
          </div>
          {view === "map" && <div className="lg:hidden">{map}</div>}
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] lg:grid-cols-1 xl:grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {list.map(s => (
              <Card key={s.id} onClick={() => nav.push({ name: "service", id: s.id })} className="h-full flex flex-col justify-between gap-4 min-w-0 cursor-pointer">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0"><div className="font-bold text-[17px] truncate">{s.name}</div>{s.promoted && <Badge tone="warn">{t.common.recommended}</Badge>}</div>
                    <div className="text-[13px] text-[var(--muted)] mt-1 line-clamp-2">{s.spec} · <span className="num">{s.dist} km</span></div>
                  </div>
                  <div className="text-right shrink-0"><Label>{t.common.from}</Label><div className="font-bold text-lg num">{s.price} zł</div></div>
                </div>
                <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-[13px] min-w-0">
                  <span className="flex items-center gap-1 font-semibold num"><Icon.star /> {s.rating}<span className="text-[var(--muted)] font-normal">({s.reviews})</span></span>
                  <span className="text-[var(--muted)] num">{s.days} {s.days === 1 ? t.common.day : t.common.days}</span>
                  <span className="text-[var(--muted)] truncate min-w-0">{s.delivery.join(" · ")}</span>
                </div>
              </Card>
            ))}
          </div>
          {list.length === 0 && <div className="text-center text-[var(--muted)] py-10">{sLoc.noResults(q)}</div>}
        </div>
        <div className="hidden lg:block sticky top-0 h-[min(640px,calc(100dvh-12rem))]">{map}</div>
      </div>
    </Screen>
  )
}

function ServiceDetail({ nav, id }: { nav: Nav; id: number }) {
  const { t } = useI18n()
  const sLoc = t.services
  const s = svc(id)
  const priceList = t.mock.priceList
  const [pick, setPick] = useState(0)
  const chosenPrice = priceList[pick]?.price ?? s.price

  return (
    <Screen title={s.name} nav={nav} footer={<Button className="w-full" onClick={() => nav.push({ name: "checkout", id, item: pick })}>{sLoc.orderWithPrice(chosenPrice ? `${chosenPrice} zł` : t.common.free)}</Button>}>
      <Card tone="pearl" className="space-y-5">
        <div className="flex items-center justify-between"><Label>{s.area}</Label><Badge tone="success">{t.common.verified}</Badge></div>
        <div className="grid grid-cols-3 gap-3 md:gap-6 num-grid">
          <div><Label>{t.common.active}</Label><div className="font-bold text-xl flex items-center gap-1"><Icon.star />{s.rating}</div></div>
          <div><Label>{t.diagnosis.timeEst}</Label><div className="font-bold text-xl">{s.days} d</div></div>
          <div><Label>Gwarancja</Label><div className="font-bold text-xl">{sLoc.monthsWarranty}</div></div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" icon={<Icon.chat />} onClick={() => nav.push({ name: "chat", id })}>{sLoc.chatBtn}</Button>
        <Button variant="secondary" icon={<Icon.phone />} onClick={() => nav.push({ name: "call", id })}>{sLoc.callBtn}</Button>
      </div>
      <div>
        <SectionTitle>{sLoc.priceListTitle}</SectionTitle>
        <Card className="py-1 divide-y divide-[var(--line)]">
          {priceList.map((p, i) => (
            <ListRow key={p.name} title={p.name} sub={sLoc.timeExecution(p.time)} onClick={() => setPick(i)}
              right={<div className="flex items-center gap-3"><span className="font-bold num">{p.price} zł</span><span className={`w-5 h-5 rounded-full border-2 ${pick === i ? "border-[var(--accent)] bg-[var(--accent)] shadow-[inset_0_0_0_3px_white]" : "border-black/15"}`} /></div>} />
          ))}
        </Card>
      </div>
      <div>
        <SectionTitle>{sLoc.reviewsTitle}</SectionTitle>
        <Card className="space-y-2">
          <div className="flex gap-0.5 text-[var(--warn)]">{[0, 1, 2, 3, 4].map(i => <Icon.star key={i} />)}</div>
          <div className="text-[15px] leading-relaxed">{sLoc.reviewSampleText}</div>
          <Label>{sLoc.reviewSampleAuthor}</Label>
        </Card>
      </div>
    </Screen>
  )
}

function Checkout({ nav, id, item, onPay }: { nav: Nav; id: number; item: number; onPay: (o: Order) => void }) {
  const { t } = useI18n()
  const cLoc = t.checkout
  const s = svc(id)
  const priceItem = t.mock.priceList[item] ?? { name: "Wymiana", price: 349, time: "24h" }
  const [delivery, setDelivery] = useState(cLoc.inpostLocker)
  const [ret, setRet] = useState(cLoc.inpostLocker)
  const [pay, setPay] = useState("BLIK")
  const [blik, setBlik] = useState("")

  const fee = (delivery === cLoc.inPerson && ret === cLoc.workshopPickup) ? 0 : 19
  const total = priceItem.price + fee
  const valid = pay !== "BLIK" || blik.length === 6

  const Opts = ({ v, set, o }: { v: string; set: (x: string) => void; o: string[] }) => (
    <div className="flex flex-wrap gap-2">
      {o.map(x => <Chip key={x} active={v === x} onClick={() => set(x)}>{x}</Chip>)}
    </div>
  )

  return (
    <Screen title={cLoc.title} nav={nav} footer={<Button className="w-full" disabled={!valid} onClick={() => { onPay({ service: s, item: priceItem.name, price: priceItem.price, total, step: 1, delivery, ret, pay }); nav.push({ name: "success" }) }}>{cLoc.payBtn(total)}</Button>}>
      <Card tone="pearl"><Label>{s.name}</Label><div className="text-lg font-bold mt-1">{priceItem.name}</div></Card>
      <div className="space-y-3">
        <SectionTitle>{cLoc.shippingToService}</SectionTitle>
        <Opts v={delivery} set={setDelivery} o={[cLoc.inpostLocker, cLoc.courier, cLoc.inPerson]} />
      </div>
      <div className="space-y-3">
        <SectionTitle>{cLoc.returnDevice}</SectionTitle>
        <Opts v={ret} set={setRet} o={[cLoc.inpostLocker, cLoc.courier, cLoc.workshopPickup]} />
      </div>
      <div className="space-y-3">
        <SectionTitle>{cLoc.paymentTitle}</SectionTitle>
        <Opts v={pay} set={setPay} o={["BLIK", "Apple Pay", "Google Pay", "Gotówka"]} />
        {pay === "BLIK" && <Field inputMode="numeric" maxLength={6} value={blik} onChange={e => setBlik(e.target.value.replace(/\D/g, ""))} placeholder={cLoc.blikCodePlaceholder} />}
        {pay === "Gotówka" && <div className="text-[13px] text-[var(--muted)]">{cLoc.cashNotice}</div>}
      </div>
      <Card className="space-y-3 text-[15px]">
        <div className="flex justify-between"><span className="text-[var(--muted)]">{cLoc.repairCost}</span><span>{priceItem.price} zł</span></div>
        <div className="flex justify-between"><span className="text-[var(--muted)]">{cLoc.logisticsFee}</span><span>{fee} zł</span></div>
        <div className="flex justify-between font-bold text-lg pt-3 border-t border-[var(--line)]"><span>{cLoc.total}</span><span>{total} zł</span></div>
        <div className="text-[13px] text-[var(--muted)]">{cLoc.escrowNotice}</div>
      </Card>
    </Screen>
  )
}

function Success({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const sLoc = t.success
  return (
    <Screen footer={<div className="space-y-3"><Button className="w-full" onClick={() => nav.push({ name: "label" })}>{sLoc.showLabelBtn}</Button><Button variant="secondary" className="w-full" onClick={() => nav.tab("orders")}>{sLoc.goToOrderBtn}</Button></div>}>
      <div className="pt-16 flex flex-col items-center text-center gap-5">
        <div className="w-20 h-20 rounded-full grad-pearl grid place-items-center"><Icon.check /></div>
        <div className="text-[28px] font-light">{sLoc.title} <span className="font-bold">{sLoc.titleAccent}</span></div>
        <div className="text-[var(--muted)] max-w-xs">{sLoc.orderCreatedDesc}</div>
      </div>
    </Screen>
  )
}

function LabelScreen({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const lLoc = t.label
  const steps = [lLoc.step1, lLoc.step2, lLoc.step3, lLoc.step4]

  return (
    <Screen title={lLoc.title} nav={nav} footer={<Button className="w-full" onClick={() => nav.tab("orders")}>{lLoc.doneBtn}</Button>}>
      <Card tone="ink" className="space-y-6 py-8 text-center">
        <Label><span className="text-white/60">{lLoc.lockerCodeLabel}</span></Label>
        <div className="text-5xl font-bold tracking-[0.2em] text-white">482 913</div>
        <div className="mx-auto w-40 h-40 rounded-2xl bg-white grid grid-cols-8 gap-0.5 p-3">{Array.from({ length: 64 }).map((_, i) => <div key={i} className={(i * 7 + (i % 5)) % 3 === 0 ? "bg-[#13141c]" : ""} />)}</div>
      </Card>
      <div>
        <SectionTitle>{lLoc.howToPackTitle}</SectionTitle>
        <Card className="py-1 divide-y divide-[var(--line)]">
          {steps.map((st, i) => <ListRow key={st} title={`${i + 1}. ${st}`} right={<span />} />)}
        </Card>
      </div>
    </Screen>
  )
}

/* ─── 03 Zamówienia ─── */
function Orders({ nav, order, setOrder }: { nav: Nav; order: Order | null; setOrder: (o: Order) => void }) {
  const { t } = useI18n()
  const oLoc = t.orders
  const orderSteps = t.mock.orderSteps
  const history = t.mock.history

  return (
    <Screen>
      <Hero eyebrow={oLoc.eyebrow} title={<>{oLoc.title} <span className="font-bold">{oLoc.titleAccent}</span></>} right={<RotatingStamp text={oLoc.inpostTrackingStamp} tone="lilac" onClick={() => nav.push({ name: order ? "label" : "notifications" })}><Icon.box /></RotatingStamp>} />
      {order ? (
        <>
          <Card tone="pearl" className="space-y-5">
            <div className="flex justify-between items-center"><Label>RF-20481 · {order.service.name}</Label><Badge tone="accent">{t.common.inProgress}</Badge></div>
            <div className="text-xl font-bold">{order.item}</div>
            <div className="space-y-2"><div className="flex justify-between text-[13px]"><span className="text-[var(--muted)]">{orderSteps[order.step] ?? ""}</span><span className="font-semibold">{Math.round((order.step / (orderSteps.length - 1)) * 100)}%</span></div><Progress value={(order.step / (orderSteps.length - 1)) * 100} /></div>
            <div className="grid grid-cols-3 gap-3 md:gap-6 num-grid"><div><Label>{oLoc.amountLabel}</Label><div className="font-bold">{order.total} zł</div></div><div><Label>{oLoc.shippingLabel}</Label><div className="font-bold text-sm">{order.delivery.replace("Paczkomat ", "")}</div></div><div><Label>{oLoc.paymentLabel}</Label><div className="font-bold">{order.pay}</div></div></div>
          </Card>
          {order.step === 1 && <Card onClick={() => nav.push({ name: "label" })} className="flex items-center justify-between cursor-pointer"><div><Label>{oLoc.lockerCodeCardLabel}</Label><div className="text-2xl font-bold tracking-widest mt-1">482 913</div></div><Icon.box /></Card>}
          {order.step === 4 && order.extra === "pending" && (
            <Card tone="sand" className="space-y-4">
              <div><Label>{oLoc.extraRequestTitle}</Label><div className="font-bold text-lg mt-1">{oLoc.extraRequestDesc}</div></div>
              <div className="grid grid-cols-2 gap-3"><Button onClick={() => setOrder({ ...order, extra: "accepted", total: order.total + 60, step: 5 })}>{oLoc.acceptBtn}</Button><Button variant="secondary" onClick={() => setOrder({ ...order, extra: "declined", step: 5 })}>{oLoc.declineBtn}</Button></div>
            </Card>
          )}
          <div>
            <SectionTitle>{oLoc.timelineTitle}</SectionTitle>
            <Card className="space-y-0">
              {orderSteps.map((stepText, i) => (
                <div key={stepText} className="flex gap-4">
                  <div className="flex flex-col items-center"><div className={`w-3 h-3 rounded-full mt-1.5 ${i <= order.step ? "bg-[var(--accent)]" : "bg-black/10 dark:bg-white/10"} ${i === order.step ? "ring-4 ring-[var(--accent)]/15" : ""}`} />{i < orderSteps.length - 1 && <div className={`w-px flex-1 min-h-7 ${i < order.step ? "bg-[var(--accent)]" : "bg-black/10 dark:bg-white/10"}`} />}</div>
                  <div className={`pb-5 text-[15px] ${i <= order.step ? "font-semibold" : "text-[var(--muted)]"}`}>{stepText}</div>
                </div>
              ))}
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" icon={<Icon.chat />} onClick={() => nav.push({ name: "chat", id: order.service.id })}>{oLoc.chatWithShopBtn}</Button>
            <Button variant="ghost" disabled={order.step >= orderSteps.length - 1 || (order.step === 4 && order.extra === "pending")} onClick={() => setOrder({ ...order, step: order.step + 1, extra: order.step + 1 === 4 && !order.extra ? "pending" : order.extra })}>{oLoc.simulateStatusBtn}</Button>
          </div>
        </>
      ) : (
        <Card className="text-center space-y-4 py-8"><div className="text-[var(--muted)]">{oLoc.noOrdersDesc}</div><Button className="mx-auto" onClick={() => nav.tab("diag")}>{oLoc.startDiagBtn}</Button></Card>
      )}
      <div>
        <SectionTitle action={oLoc.viewAllAction} onAction={() => nav.push({ name: "history" })}>{oLoc.historyTitle}</SectionTitle>
        <Card className="py-1 divide-y divide-[var(--line)]">{history.map(h => <ListRow key={h.id} title={h.title} sub={`${h.date} · ${h.price} zł`} onClick={() => nav.push({ name: "historyItem", id: h.id })} />)}</Card>
      </div>
    </Screen>
  )
}

/* ─── 04 Wiedza ─── */
function Knowledge({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const kLoc = t.knowledge
  const allCats = [kLoc.allCategory, kLoc.tipsCategory, kLoc.questionsCategory, kLoc.guidesCategory]
  const [cat, setCat] = useState(kLoc.allCategory)
  const [liked, setLiked] = useState<number[]>([])

  // Normalize category comparison
  const posts = t.mock.posts.filter(p => cat === kLoc.allCategory || p.cat === cat || (cat === "Wszystko" || cat === "All" || cat === "Все" || cat === "Все"))

  return (
    <Screen footer={<Button className="w-full" icon={<Icon.plus />} onClick={() => nav.push({ name: "newPost" })}>{kLoc.newPostBtn}</Button>}>
      <Hero eyebrow={kLoc.eyebrow} title={<>{kLoc.title} <span className="font-bold">{kLoc.titleAccent}</span></>} right={<RotatingStamp text={kLoc.newPostStamp} tone="pearl" onClick={() => nav.push({ name: "newPost" })}><Icon.plus /></RotatingStamp>} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
        {allCats.map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        {posts.map(p => (
          <Card key={p.id} onClick={() => nav.push({ name: "post", id: p.id })} className="h-full flex flex-col justify-between gap-3 min-w-0 cursor-pointer">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full grad-lilac grid place-items-center font-bold text-sm">{p.author[0]}</div><div className="flex-1"><div className="font-semibold text-sm">{p.author}</div><Label>{p.cat}</Label></div><Badge tone={p.role === "Serwis" || p.role === "Service" || p.role === "Сервіс" || p.role === "Сервис" ? "success" : "neutral"}>{p.role}</Badge></div>
            <div className="font-bold text-[17px] leading-snug line-clamp-2">{p.title}</div>
            <div className="flex items-center gap-5 text-[13px] text-[var(--muted)]">
              <button onClick={e => { e.stopPropagation(); setLiked(l => l.includes(p.id) ? l.filter(x => x !== p.id) : [...l, p.id]) }} className={`flex items-center gap-1.5 cursor-pointer ${liked.includes(p.id) ? "text-[var(--accent)] font-semibold" : ""}`}><Icon.heart /> {p.likes + (liked.includes(p.id) ? 1 : 0)}</button>
              <span>{kLoc.repliesCount(p.replies)}</span>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  )
}

function PostDetail({ nav, id }: { nav: Nav; id: number }) {
  const { t } = useI18n()
  const kLoc = t.knowledge
  const p = t.mock.posts.find(x => x.id === id) ?? t.mock.posts[0]!
  const [replies, setReplies] = useState<string[]>([])
  const [replyText, setReplyText] = useState("")

  return (
    <Screen title={p.cat} nav={nav} footer={<div className="flex gap-2"><Field value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={kLoc.replyPlaceholder} className="h-11" /><IconButton label={t.common.send} dark onClick={() => { if (replyText.trim()) { setReplies(r => [...r, replyText]); setReplyText("") } }}><Icon.send /></IconButton></div>}>
      <div className="space-y-3"><Label>{p.author} · {p.role}</Label><div className="text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] font-bold leading-tight text-balance">{p.title}</div><div className="text-[15px] leading-relaxed text-[var(--ink)]/80 dark:text-white/80">{p.body}</div></div>
      <div>
        <SectionTitle>{kLoc.repliesTitle(p.replies + replies.length)}</SectionTitle>
        <div className="space-y-3">
          <Card className="space-y-1"><div className="font-semibold text-sm">iSerwis Centrum</div><div className="text-[15px]">{t.services.reviewSampleText}</div></Card>
          {replies.map((r, i) => <Card key={i} className="space-y-1"><div className="font-semibold text-sm">{kLoc.youAuthor}</div><div className="text-[15px]">{r}</div></Card>)}
        </div>
      </div>
    </Screen>
  )
}

function NewPost({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const kLoc = t.knowledge
  const [title, setTitle] = useState("")
  const [cat, setCat] = useState(kLoc.questionsCategory)
  const [sent, setSent] = useState(false)

  if (sent) return (
    <Screen title={kLoc.newPostBtn} nav={nav} footer={<Button className="w-full" onClick={() => nav.tab("knowledge")}>{kLoc.backToKnowledgeBtn}</Button>}>
      <Card tone="pearl" className="text-center py-10"><div className="text-xl font-bold">{kLoc.publishedSuccessTitle}</div><div className="text-[var(--muted)] mt-2">{kLoc.publishedSuccessSub}</div></Card>
    </Screen>
  )

  return (
    <Screen title={kLoc.newPostBtn} nav={nav} footer={<Button className="w-full" disabled={!title.trim()} onClick={() => setSent(true)}>{kLoc.publishBtn}</Button>}>
      <div className="space-y-3">
        <SectionTitle>{kLoc.postCategoryTitle}</SectionTitle>
        <div className="flex gap-2">{[kLoc.questionsCategory, kLoc.tipsCategory, kLoc.guidesCategory].map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div>
      </div>
      <div className="space-y-3"><SectionTitle>{kLoc.postTitleLabel}</SectionTitle><Field value={title} onChange={e => setTitle(e.target.value)} placeholder={kLoc.postTitlePlaceholder} /></div>
      <div className="space-y-3"><SectionTitle>{kLoc.postBodyLabel}</SectionTitle><textarea rows={6} placeholder={kLoc.postBodyPlaceholder} className="w-full rounded-[28px] glass-strong p-5 outline-none text-[15px] resize-none" /></div>
    </Screen>
  )
}

/* ─── 05 Profil ─── */
function Profile({ nav, user, logout }: { nav: Nav; user: UserProfile; logout: () => void }) {
  const { t, lang, setLang } = useI18n()
  const pLoc = t.profile

  return (
    <Screen>
      <div className="flex items-center gap-4 pt-2">
        <div className="flex-1 min-w-0"><div className="text-[22px] font-bold leading-tight">{user.name}</div><Label>{user.email}</Label></div>
        <RotatingStamp text="Care+ Profil" tone="ink" onClick={() => nav.push({ name: "subscription" })}><span className="text-white"><Icon.user /></span></RotatingStamp>
      </div>
      <Card tone="ink" onClick={() => nav.push({ name: "subscription" })} className="space-y-4 cursor-pointer">
        <div className="flex justify-between items-center"><span className="text-white/60 text-[13px]">{pLoc.yourPackage}</span><span className="text-[13px] text-white/80">{pLoc.manage} →</span></div>
        <div className="text-2xl font-bold text-white">ReFix Care+</div>
        <div className="text-white/70 text-[13px]">{pLoc.carePlusSub}</div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card tone="sage" onClick={() => nav.push({ name: "history" })} className="cursor-pointer"><Label>{pLoc.repairsCount}</Label><div className="text-2xl font-bold mt-1">{t.mock.history.length + 1}</div></Card>
        <Card tone="lilac" onClick={() => nav.push({ name: "referral" })} className="cursor-pointer"><Label>{pLoc.referralsCount}</Label><div className="text-2xl font-bold mt-1">+30 zł</div></Card>
      </div>
      <div>
        <SectionTitle>{pLoc.settingsTitle}</SectionTitle>
        <Card className="py-1 divide-y divide-[var(--line)]">
          <ListRow title={pLoc.languageRow} right={
            <div className="flex gap-1">
              {(["PL", "EN", "UA", "RU"] as const).map(l => (
                <button key={l} onClick={e => { e.stopPropagation(); setLang(l) }} className={`h-8 px-2.5 rounded-full text-xs font-bold cursor-pointer transition ${lang === l ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm" : "bg-white/70 dark:bg-white/10 text-[var(--ink)]"}`}>{l}</button>
              ))}
            </div>
          } />
          <ListRow title={pLoc.notificationsAndTheme} onClick={() => nav.push({ name: "settings" })} />
          <ListRow title={pLoc.subAndPayments} onClick={() => nav.push({ name: "subscription" })} />
          <ListRow title={pLoc.faq} onClick={() => nav.push({ name: "faq" })} />
          <ListRow title={pLoc.support} onClick={() => nav.push({ name: "support" })} />
          <ListRow title={pLoc.switchAccount} sub={pLoc.switchAccountSub} onClick={() => nav.push({ name: "accounts" })} />
        </Card>
      </div>
      <Button variant="ghost" className="w-full" onClick={logout}>{pLoc.logoutBtn}</Button>
      <div className="flex flex-col items-center gap-1 pt-2 opacity-60"><Logo size={20} /><Label>{t.common.version}</Label></div>
    </Screen>
  )
}

function Subscription({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const subLoc = t.subscription
  const [plan, setPlan] = useState("care")
  const plans = [
    ["basic", subLoc.basicName, subLoc.basicPrice, subLoc.basicDesc],
    ["care", subLoc.careName, subLoc.carePrice, subLoc.careDesc],
    ["biz", subLoc.bizName, subLoc.bizPrice, subLoc.bizDesc]
  ] as const
  const [saved, setSaved] = useState(false)

  return (
    <Screen title={subLoc.title} nav={nav} footer={<Button className="w-full" onClick={() => setSaved(true)}>{saved ? t.common.saved : subLoc.savePlanBtn}</Button>}>
      <div className="space-y-3">{plans.map(([k, n, p, d]) => <Card key={k} tone={plan === k ? "pearl" : "glass"} onClick={() => { setPlan(k); setSaved(false) }} className={`cursor-pointer ${plan === k ? "ring-2 ring-[var(--accent)]/30" : ""}`}><div className="flex justify-between items-center"><div className="font-bold text-lg">{n}</div><div className="font-semibold">{p}</div></div><div className="text-[13px] text-[var(--muted)] mt-2">{d}</div></Card>)}</div>
      <div><SectionTitle>{subLoc.paymentMethodsTitle}</SectionTitle><Card className="py-1 divide-y divide-[var(--line)]"><ListRow title="BLIK" sub={subLoc.defaultBadge} right={<Badge tone="success">{t.common.active}</Badge>} /><ListRow title="Apple Pay" sub="iPhone" right={<Badge>{t.common.connected}</Badge>} /></Card></div>
    </Screen>
  )
}

function Referral({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const refLoc = t.referral
  const [copied, setCopied] = useState(false)

  return (
    <Screen title={refLoc.title} nav={nav} footer={<Button className="w-full" onClick={() => { navigator.clipboard?.writeText("MICHAL30"); setCopied(true) }}>{copied ? t.common.copied : refLoc.copyCodeBtn}</Button>}>
      <Card tone="lilac" className="text-center py-10 space-y-3"><Label>{refLoc.yourCodeLabel}</Label><div className="text-4xl font-bold tracking-widest">MICHAL30</div><div className="text-[var(--muted)] text-[15px]">{refLoc.codeDesc}</div></Card>
      <div className="grid grid-cols-2 gap-3"><Card><Label>{refLoc.invitedLabel}</Label><div className="text-2xl font-bold mt-1">3</div></Card><Card><Label>{refLoc.earnedLabel}</Label><div className="text-2xl font-bold mt-1">90 zł</div></Card></div>
    </Screen>
  )
}

function Settings({ nav, dark, setDark }: { nav: Nav; dark: boolean; setDark: (v: boolean) => void }) {
  const { t } = useI18n()
  const sLoc = t.settings
  const [s, set] = useState({ push: true, sms: true, mail: false })
  const row = (k: keyof typeof s, title: string, sub: string) => <ListRow title={title} sub={sub} right={<Toggle on={s[k]} onChange={v => set({ ...s, [k]: v })} />} />

  return (
    <Screen title={sLoc.title} nav={nav}>
      <div><SectionTitle>{sLoc.notificationsSection}</SectionTitle><Card className="py-1 divide-y divide-[var(--line)]">{row("push", sLoc.pushTitle, sLoc.pushSub)}{row("sms", sLoc.smsTitle, sLoc.smsSub)}{row("mail", sLoc.mailTitle, sLoc.mailSub)}</Card></div>
      <div><SectionTitle>{sLoc.appearanceSection}</SectionTitle><Card className="py-1"><ListRow title={sLoc.darkThemeTitle} sub={sLoc.darkThemeSub} right={<Toggle on={dark} onChange={setDark} />} /></Card></div>
    </Screen>
  )
}

function FaqScreen({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const faqLoc = t.faq
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Screen title={faqLoc.title} nav={nav} footer={<Button variant="secondary" className="w-full" onClick={() => nav.push({ name: "support" })}>{faqLoc.noAnswerBtn}</Button>}>
      <div className="space-y-3">{faqLoc.items.map(([q, a], i) => <Card key={q} onClick={() => setOpen(open === i ? null : i)} className="cursor-pointer"><div className="flex justify-between items-center gap-3"><div className="font-semibold">{q}</div><span className="text-xl text-[var(--muted)]">{open === i ? "−" : "+"}</span></div>{open === i && <div className="text-[15px] text-[var(--muted)] mt-3 leading-relaxed">{a}</div>}</Card>)}</div>
    </Screen>
  )
}

function ChatScreen({ nav, title, intro }: { nav: Nav; title: string; intro: string }) {
  const { t } = useI18n()
  const chatLoc = t.chat
  const [msgs, setMsgs] = useState([{ me: false, t: intro }])
  const [text, setText] = useState("")

  const send = () => {
    if (!text.trim()) return
    setMsgs(m => [...m, { me: true, t: text }])
    setText("")
    setTimeout(() => setMsgs(m => [...m, { me: false, t: chatLoc.autoReply }]), 700)
  }

  return (
    <Screen title={title} nav={nav} footer={<div className="flex gap-2"><Field value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={chatLoc.inputPlaceholder} className="h-11" /><IconButton label={t.common.send} dark onClick={send}><Icon.send /></IconButton></div>}>
      <div className="space-y-3">{msgs.map((m, i) => <div key={i} className={`max-w-[min(85%,36rem)] px-5 break-words py-3.5 rounded-3xl text-[15px] ${m.me ? "bg-[var(--bubble-user-bg)] text-[var(--bubble-user-text)] ml-auto shadow-sm" : "glass"}`}>{m.t}</div>)}</div>
    </Screen>
  )
}

function Call({ nav, id }: { nav: Nav; id: number }) {
  const { t } = useI18n()
  const callLoc = t.call
  const s = svc(id)

  return (
    <Screen nav={nav} title={callLoc.title} footer={<Button className="w-full bg-[#b5483a]" onClick={nav.back}>{callLoc.hangupBtn}</Button>}>
      <div className="pt-16 flex flex-col items-center gap-4 text-center"><div className="w-24 h-24 rounded-full grad-pearl grid place-items-center"><Icon.phone /></div><div className="text-2xl font-bold">{s.name}</div><div className="text-[var(--muted)]">{s.phone}</div><Badge tone="accent">{callLoc.connecting}</Badge></div>
    </Screen>
  )
}

function Notifications({ nav, order }: { nav: Nav; order: Order | null }) {
  const { t } = useI18n()
  const orderSteps = t.mock.orderSteps

  const items = [
    ...(order ? [{ t: `Zamówienie RF-20481: ${orderSteps[order.step] ?? ""}`, d: "Teraz", go: () => nav.tab("orders") }] : []),
    { t: "Nowa odpowiedź w wątku społeczności", d: "2 godz. temu", go: () => nav.push({ name: "post", id: 2 }) },
    { t: "Care+ odnowi się 14 czerwca", d: "Wczoraj", go: () => nav.push({ name: "subscription" }) },
  ]
  return <Screen title={t.common.notifications} nav={nav}><Card className="py-1 divide-y divide-[var(--line)]">{items.map(i => <ListRow key={i.t} title={i.t} sub={i.d} onClick={i.go} />)}</Card></Screen>
}

function History({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const history = t.mock.history

  return <Screen title={t.orders.historyTitle} nav={nav}><Card className="py-1 divide-y divide-[var(--line)]">{history.map(h => <ListRow key={h.id} title={h.title} sub={`${h.shop} · ${h.date}`} onClick={() => nav.push({ name: "historyItem", id: h.id })} />)}</Card></Screen>
}

function HistoryItem({ nav, id }: { nav: Nav; id: string }) {
  const { t } = useI18n()
  const oLoc = t.orders
  const h = t.mock.history.find(x => x.id === id) ?? t.mock.history[0]!
  const s = SERVICES.find(x => x.name === h.shop) ?? SERVICES[0]!

  return (
    <Screen title={h.id} nav={nav} footer={<Button className="w-full" onClick={() => nav.push({ name: "service", id: s.id })}>{oLoc.reorderBtn(h.shop)}</Button>}>
      <Card tone="sage" className="space-y-2"><Badge tone="success">{t.common.completed}</Badge><div className="text-xl font-bold">{h.title}</div><Label>{h.shop} · {h.date}</Label></Card>
      <Card className="space-y-3 text-[15px]"><div className="flex justify-between"><span className="text-[var(--muted)]">{oLoc.amountLabel}</span><b>{h.price} zł</b></div><div className="flex justify-between"><span className="text-[var(--muted)]">{oLoc.warrantyUntil}</span><b>wrz 2025</b></div></Card>
      <Button variant="secondary" className="w-full" onClick={() => nav.push({ name: "support" })}>{oLoc.claimWarrantyBtn}</Button>
    </Screen>
  )
}

function Accounts({ nav }: { nav: Nav }) {
  const { t } = useI18n()
  const aLoc = t.accounts
  const [acc, setAcc] = useState("client")

  return (
    <Screen title={aLoc.title} nav={nav} footer={<Button className="w-full" onClick={() => nav.tab("profile")}>{aLoc.switchBtn}</Button>}>
      <div className="space-y-3">
        {([["client", aLoc.clientName, aLoc.clientSub], ["partner", aLoc.partnerName, aLoc.partnerSub]] as const).map(([k, n, d]) => <Card key={k} tone={acc === k ? "pearl" : "glass"} onClick={() => setAcc(k)} className="cursor-pointer"><div className="font-bold">{n}</div><Label>{d}</Label></Card>)}
        <Button variant="ghost" className="w-full" icon={<Icon.plus />} onClick={() => nav.push({ name: "support" })}>{aLoc.addPartnerShopBtn}</Button>
      </div>
    </Screen>
  )
}

/* ─── Main Content ─── */
function MainApp() {
  const { t, lang, setLang } = useI18n()
  const [tab, setTab] = useState<Tab>("diag")
  const [stack, setStack] = useState<Route[]>([{ name: "tab" }])
  const [order, setOrder] = useState<Order | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [dark, setDark] = useState<boolean>(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("rg-theme") : null
    if (saved) return saved === "dark"
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rg-theme", dark ? "dark" : "light")
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute("content", dark ? "#13141c" : "#f2f2f5")
    }
    const bridge = (window as unknown as { AndroidThemeBridge?: { setDarkMode: (d: boolean) => void } }).AndroidThemeBridge
    if (bridge?.setDarkMode) {
      bridge.setDarkMode(dark)
    }
  }, [dark])

  const nav: Nav = {
    push: r => setStack(s => [...s, r]),
    back: () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
    tab: t => { setTab(t); setStack([{ name: "tab" }]) },
  }

  const r = stack[stack.length - 1] ?? { name: "tab" as const }

  const screen = (() => {
    switch (r.name) {
      case "service": return <ServiceDetail nav={nav} id={r.id} />
      case "checkout": return <Checkout nav={nav} id={r.id} item={r.item} onPay={setOrder} />
      case "success": return <Success nav={nav} />
      case "label": return <LabelScreen nav={nav} />
      case "chat": return <ChatScreen nav={nav} title={svc(r.id).name} intro={t.chat.supportIntro} />
      case "call": return <Call nav={nav} id={r.id} />
      case "post": return <PostDetail nav={nav} id={r.id} />
      case "newPost": return <NewPost nav={nav} />
      case "notifications": return <Notifications nav={nav} order={order} />
      case "subscription": return <Subscription nav={nav} />
      case "referral": return <Referral nav={nav} />
      case "history": return <History nav={nav} />
      case "historyItem": return <HistoryItem nav={nav} id={r.id} />
      case "settings": return <Settings nav={nav} dark={dark} setDark={setDark} />
      case "faq": return <FaqScreen nav={nav} />
      case "support": return <ChatScreen nav={nav} title={t.chat.supportTitle} intro={t.chat.supportIntro} />
      case "accounts": return <Accounts nav={nav} />
      default:
        return {
          diag: <Diagnosis nav={nav} userName={user?.name.split(" ")[0] ?? ""} />,
          services: <ServicesScreen nav={nav} />,
          orders: <Orders nav={nav} order={order} setOrder={setOrder} />,
          knowledge: <Knowledge nav={nav} />,
          profile: <Profile nav={nav} user={user!} logout={() => { setUser(null); setOrder(null); setTab("diag"); setStack([{ name: "tab" }]) }} />
        }[tab]
    }
  })()

  const tabs: [Tab, string, () => ReactNode][] = [
    ["diag", t.tabs.diag, Icon.spark],
    ["services", t.tabs.services, Icon.pin],
    ["orders", t.tabs.orders, Icon.box],
    ["knowledge", t.tabs.knowledge, Icon.book],
    ["profile", t.tabs.profile, Icon.user]
  ]

  const showNav = user && r.name === "tab"

  const navItems = (vertical: boolean) => tabs.map(([k, l, I]) => {
    const on = tab === k
    return vertical ? (
      <button key={k} onClick={() => nav.tab(k)} aria-current={on ? "page" : undefined} className={`h-12 w-full rounded-full flex items-center gap-3 px-4 text-[15px] font-semibold transition cursor-pointer min-w-0 ${on ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-sm" : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"}`}>
        <I /><span className="truncate">{l}</span>
      </button>
    ) : (
      <button key={k} onClick={() => nav.tab(k)} aria-label={l} aria-current={on ? "page" : undefined} className={`h-14 min-w-0 rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold transition-all duration-300 cursor-pointer ${on ? "flex-[2.4] bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] px-4 shadow-sm" : "flex-1 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"}`}>
        <I />{on && <span className="truncate">{l}</span>}
      </button>
    )
  })

  return (
    <div className="app-bg h-dvh w-full overflow-hidden flex">
      {user && (
        <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col gap-8 p-6 xl:p-8 border-r border-white/50 dark:border-white/10 glass rounded-none">
          <Logo size={30} />
          <nav className="flex flex-col gap-1.5" aria-label="Nawigacja główna">{navItems(true)}</nav>
          <div className="mt-auto text-[13px] text-[var(--muted)] truncate">{user.name}</div>
        </aside>
      )}
      <div className="relative flex-1 min-w-0 flex flex-col">
        <main key={user ? stack.length + tab + r.name : "auth"} className={`flex-1 min-h-0 overflow-hidden ${showNav ? "max-lg:[&_.screen-root:not(:has(.screen-footer))_.scroll-area]:pb-28 max-lg:[&_.screen-footer]:pb-28" : ""}`}>
          {user ? screen : <Onboarding onComplete={u => { setUser(u); setLang(u.lang) }} />}
        </main>
        {showNav && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-20 px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
            <nav aria-label="Nawigacja główna" className="pointer-events-auto mx-auto max-w-xl glass-strong rounded-[32px] p-2 flex items-center gap-1 shadow-lg border border-white/40 dark:border-white/10">{navItems(false)}</nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  )
}
