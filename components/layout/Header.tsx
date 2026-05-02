import Link from 'next/link'
import { getUser, signOut } from '@/lib/actions/auth'
import { getT } from '@/lib/i18n/server'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'
import { ShieldCheck } from 'lucide-react'

export async function Header() {
  const [user, t] = await Promise.all([getUser(), Promise.resolve(getT())])

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold text-base tracking-tight">
          Badminton Manager
        </Link>

        <div className="flex items-center gap-1">
          <LocaleToggle />
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {t.adminBadge}
              </span>
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  {t.logout}
                </Button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.loginAdmin}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
