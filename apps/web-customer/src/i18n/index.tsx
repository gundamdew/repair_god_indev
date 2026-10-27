import { createContext, useContext, useState, type ReactNode } from "react"
import { pl } from "./locales/pl"
import { en } from "./locales/en"
import { ua } from "./locales/ua"
import { ru } from "./locales/ru"
import type { Language, TranslationDictionary } from "./types"

export type { Language, TranslationDictionary }

export const translations: Record<Language, TranslationDictionary> = {
  PL: pl,
  EN: en,
  UA: ua,
  RU: ru,
}

export function getTranslation(lang: Language): TranslationDictionary {
  return translations[lang] || translations.PL
}

interface I18nContextType {
  lang: Language
  setLang: (l: Language) => void
  t: TranslationDictionary
}

const I18nContext = createContext<I18nContextType>({
  lang: "PL",
  setLang: () => {},
  t: pl,
})

export function I18nProvider({
  children,
  initialLang = "PL",
  onLangChange,
}: {
  children: ReactNode
  initialLang?: Language
  onLangChange?: (l: Language) => void
}) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("rg-lang") as Language
      if (saved && (saved === "PL" || saved === "EN" || saved === "UA" || saved === "RU")) {
        return saved
      }
    }
    return initialLang
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rg-lang", newLang)
    }
    onLangChange?.(newLang)
  }

  const t = getTranslation(lang)

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext)
}
