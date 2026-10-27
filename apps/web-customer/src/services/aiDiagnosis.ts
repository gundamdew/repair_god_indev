export interface ChatMessage {
  ai: boolean
  t: string
  image?: string // Data URL or base64 preview
  mimeType?: string
}

export interface DiagnosticResult {
  title: string
  servicesCount: number
  priceFrom: string
  days: string
  confidence: string
}

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash"
]

export async function askGeminiDiagnostic(
  history: ChatMessage[],
  userName: string,
  lang: string
): Promise<{ reply: string; result?: DiagnosticResult }> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()

  const systemInstructions = `Jesteś ekspertem diagnostyki i wyceny napraw urządzeń elektronicznych (smartfony, laptopy, tablety, konsole) w platformie Repair God (ReFix).
Rozmawiasz z klientem o imieniu: ${userName || "Klient"}.
Język odpowiedzi: ${lang === "PL" ? "Polski" : lang === "UA" ? "Ukraiński" : lang === "RU" ? "Rosyjski" : "Angielski"}.

Twoje zadania:
1. Odpowiadaj na pytania użytkownika w naturalny, pomocny i profesjonalny sposób. Jeśli pytanie dotyczy urządzeń, elektroniki lub napraw – zdiagnozuj problem i zaproponuj rozwiązanie. Jeśli użytkownik zadaje inne pytania (np. luźna rozmowa, ciekawostki, przepisy), odpowiedz uprzejmie i ze smakiem nawiąż do serwisu urządzeń domowych/elektroniki.
2. W przypadku zgłoszenia uszkodzenia sprzętu lub przesłania zdjęcia:
   - Zdiagnozuj co uległo uszkodzeniu (np. wyświetlacz, bateria, port USB, układ zasilania)
   - Podaj szacowany koszt w PLN (np. 189 zł, 299 zł)
   - Podaj szacowany czas naprawy (np. 1–2 dni)
   - Na samym końcu wiadomości dodaj ukryty blok:
<<<DIAG:{"title":"Nazwa naprawy","priceFrom":"299 zł","days":"1–2 dni","confidence":"89%"}>>>`

  if (apiKey) {
    // Format contents for Gemini API with strict alternating turns (user -> model -> user)
    const cleanContents: { role: "user" | "model"; parts: any[] }[] = []

    // If first message in history is the initial AI greeting, skip it so the sequence starts with user
    const conversation = [...history]
    if (conversation.length > 0 && conversation[0]?.ai) {
      conversation.shift()
    }

    for (const msg of conversation) {
      const parts: any[] = []

      // If user attached an image, convert to Gemini inlineData
      if (msg.image && msg.image.startsWith("data:")) {
        const matches = msg.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
        if (matches && matches[1] && matches[2]) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          })
        }
      }

      if (msg.t) {
        parts.push({ text: msg.t })
      }

      if (parts.length > 0) {
        const role = msg.ai ? "model" : "user"
        const last = cleanContents[cleanContents.length - 1]
        // Merge consecutive turns with the same role to satisfy Gemini API constraints
        if (last && last.role === role) {
          last.parts.push(...parts)
        } else {
          cleanContents.push({ role, parts })
        }
      }
    }

    // Try candidate models in order until one responds
    for (const model of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 20000)

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstructions }]
              },
              contents: cleanContents,
              generationConfig: {
                temperature: 0.4
              }
            }),
            signal: controller.signal
          }
        )
        clearTimeout(timeout)

        if (res.ok) {
          const data = (await res.json()) as any
          const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawText && rawText.trim().length > 0) {
            // Check for <<<DIAG:...>>> block
            let cleanReply = rawText
            let result: DiagnosticResult | undefined = undefined

            const match = rawText.match(/<<<DIAG:(.+?)>>>/)
            if (match && match[1]) {
              try {
                const parsed = JSON.parse(match[1])
                result = {
                  title: parsed.title || "Naprawa urządzenia",
                  servicesCount: 4,
                  priceFrom: parsed.priceFrom || "299 zł",
                  days: parsed.days || "1–3 dni",
                  confidence: parsed.confidence || "88%"
                }
                cleanReply = rawText.replace(/<<<DIAG:.+?>>>/, "").trim()
              } catch (e) {
                // Ignore parsing error, keep text
              }
            }

            return { reply: cleanReply, result }
          }
        } else {
          const errData = await res.json().catch(() => null)
          console.warn(`Model ${model} returned ${res.status}:`, errData)
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying fallback model...`, err)
      }
    }
  }

  // Fallback heuristic if offline or all API models exhausted
  const lastUserMsg = history[history.length - 1]?.t.toLowerCase() || ""
  let fallbackReply = "Przepraszam, chwilowo nie mogę połączyć się z serwerem AI (wyczerpany dzienny limit zapytań Google Free Tier lub brak sieci). Jeśli potrzebujesz wyceny, opisz uszkodzenie lub wybierz kategorię z listy."
  let fallbackResult: DiagnosticResult | undefined = undefined

  if (lastUserMsg.includes("ekran") || lastUserMsg.includes("szyb") || lastUserMsg.includes("screen") || lastUserMsg.includes("экран")) {
    fallbackReply = "Na podstawie opisu i objawów: uszkodzony moduł wyświetlacza lub digitizer. Zalecamy wymianę wyświetlacza w sprawdzonym serwisie partnerskim."
    fallbackResult = {
      title: "Wymiana wyświetlacza",
      servicesCount: 4,
      priceFrom: "299 zł",
      days: "1–2 dni",
      confidence: "92%"
    }
  } else if (lastUserMsg.includes("bater") || lastUserMsg.includes("ładuj") || lastUserMsg.includes("battery") || lastUserMsg.includes("заряд")) {
    fallbackReply = "Objawy wskazują na degradację ogniwa baterii lub uszkodzenie gniazda ładowania. Wymiana baterii przywróci pełną sprawność urządzenia."
    fallbackResult = {
      title: "Wymiana baterii",
      servicesCount: 4,
      priceFrom: "189 zł",
      days: "1 dzień",
      confidence: "95%"
    }
  } else if (lastUserMsg.includes("zalan") || lastUserMsg.includes("wod") || lastUserMsg.includes("water") || lastUserMsg.includes("утоп")) {
    fallbackReply = "Urządzenie po kontakcie z cieczą wymaga pilnej deoksydacji płyty głównej w myjce ultradźwiękowej, aby zapobiec korozji układów zasilania."
    fallbackResult = {
      title: "Czyszczenie po zalaniu",
      servicesCount: 3,
      priceFrom: "149 zł",
      days: "2–4 dni",
      confidence: "87%"
    }
  }

  return { reply: fallbackReply, result: fallbackResult }
}
