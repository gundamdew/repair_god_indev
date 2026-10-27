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
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
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
1. Przeanalizuj opis problemu oraz załączone zdjęcia uszkodzeń (jeśli są).
2. Odpowiedz profesjonalnie, zwięźle (2-4 zdania).
3. Jeśli objawy są jasne (lub klient przesłał zdjęcie lub napisał kolejną wiadomość), podaj:
   - Co jest uszkodzone (np. moduł wyświetlacza, bateria, gniazdo zasilania, układ PMIC na płycie głównej)
   - Szacowany koszt naprawy w PLN (np. 299 zł, 349 zł, 189 zł)
   - Czas naprawy (np. 1–2 dni)
4. Na samym końcu wiadomości dodaj ukryty blok metadanych diagnozy w formacie:
<<<DIAG:{"title":"Wymiana wyświetlacza","priceFrom":"299 zł","days":"1–2 dni","confidence":"89%"}>>>`

  if (apiKey) {
    // Format contents for Gemini API (multimodal: text + inline images)
    const contents: any[] = []

    // Add conversation history
    for (const msg of history) {
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
        parts.push({ text: (msg.ai ? "Asystent: " : "Klient: ") + msg.t })
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.ai ? "model" : "user",
          parts
        })
      }
    }

    // Add system prompt context as first user turn or prepended
    const fullContents = [
      {
        role: "user",
        parts: [{ text: `[INSTRUKCJA SYSTEMOWA: ${systemInstructions}]\n\nRozpoczynamy diagnozę.` }]
      },
      {
        role: "model",
        parts: [{ text: "Rozumiem. Jestem gotowy do przeprowadzenia diagnozy urządzenia." }]
      },
      ...contents
    ]

    // Try candidate models in order until one responds
    for (const model of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 7000)

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: fullContents,
              generationConfig: {
                temperature: 0.3
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
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying fallback model...`, err)
      }
    }
  }

  // Fallback heuristic if offline or API unavailable
  const lastUserMsg = history[history.length - 1]?.t.toLowerCase() || ""
  let fallbackReply = "Rozumiem problem. Czy urządzenie reaguje na dotyk, czy widać pasy na ekranie lub czy się nagrzewa?"
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
