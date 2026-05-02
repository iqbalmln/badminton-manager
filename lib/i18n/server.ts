import { cookies } from 'next/headers'
import { translations, type Locale, type Translations } from './translations'

export function getLocale(): Locale {
  const val = cookies().get('locale')?.value
  return val === 'en' ? 'en' : 'id'
}

export function getT(): Translations {
  return translations[getLocale()]
}
