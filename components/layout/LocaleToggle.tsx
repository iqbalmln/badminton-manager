'use client'

import { useLocale } from '@/lib/i18n/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()
  const router = useRouter()

  function toggle() {
    setLocale(locale === 'id' ? 'en' : 'id')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" className="h-8 w-10 text-xs font-semibold" onClick={toggle}>
      {locale === 'id' ? 'EN' : 'ID'}
    </Button>
  )
}
