import Link from 'next/link'
import type { Route } from 'next'
import { LayoutDashboard, Users, Trophy, ChevronRight } from 'lucide-react'

const menuItems: { href: Route; label: string; description: string; icon: typeof LayoutDashboard }[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Kelola sesi & lapangan',
    icon: LayoutDashboard,
  },
  {
    href: '/players',
    label: 'Pemain',
    description: 'Kelola data pemain',
    icon: Users,
  },
  {
    href: '/ranking',
    label: 'Ranking Bulanan',
    description: 'Lihat papan peringkat',
    icon: Trophy,
  },
]

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float-orb-1 absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="animate-float-orb-2 absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
        <div className="animate-float-orb-3 absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-secondary/50 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-black tracking-tight">CourtMate</h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            by TIMOR
          </p>
          <p className="mt-2 text-balance text-muted-foreground">
            Kelola sesi olahraga komunitas secara otomatis dan adil.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {menuItems.map(({ href, label, description, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              style={{ animationDelay: `${150 + i * 100}ms` }}
              className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both group flex items-center gap-4 rounded-xl border bg-card/60 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-95"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold leading-tight">{label}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
