import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { LocaleProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Badminton Manager',
  description: 'Kelola sesi badminton komunitas — matchmaking otomatis & ranking bulanan',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = getLocale()
  return (
    <html lang={locale === 'en' ? 'en' : 'id'} className={cn('font-sans', inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            {children}
            <Toaster richColors />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
