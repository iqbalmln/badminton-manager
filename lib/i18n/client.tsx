'use client'

import { createContext, useContext, useState } from 'react'
import { translations, type Locale, type Translations } from './translations'

interface LocaleCtx {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleCtx>({ locale: 'id', setLocale: () => {} })

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  function setLocale(l: Locale) {
    setLocaleState(l)
    document.cookie = `locale=${l}; path=/; max-age=31536000; SameSite=Lax`
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useT(): Translations {
  const { locale } = useContext(LocaleContext)
  return translations[locale]
}

export function useLocale(): LocaleCtx {
  return useContext(LocaleContext)
}
