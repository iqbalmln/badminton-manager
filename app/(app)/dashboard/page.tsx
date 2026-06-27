import Link from 'next/link'
import type { Route } from 'next'
import { getSessions } from '@/lib/actions/sessions'
import { getUser } from '@/lib/actions/auth'
import { getT } from '@/lib/i18n/server'
import { DeleteSessionButton } from '@/components/session/DeleteSessionButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, Users, Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Session } from '@/types/database'
import type { Translations } from '@/lib/i18n/translations'

export const dynamic = 'force-dynamic'

const STATUS_VARIANT: Record<Session['status'], 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  finished: 'secondary',
}

export default async function DashboardPage() {
  const [sessions, user, t] = await Promise.all([getSessions(), getUser(), Promise.resolve(getT())])
  const isAdmin = !!user
  const activeSessions = sessions.filter((s) => s.status === 'active')
  const recentSessions = sessions.slice(0, 10)

  const statusLabel: Record<Session['status'], string> = {
    draft: t.statusDraft,
    active: t.statusActive,
    finished: t.statusFinished,
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.dashboardTitle}</h1>
        {isAdmin && (
          <Link href="/session/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.newSession}
          </Link>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t.statActive}</p>
            <p className="text-3xl font-bold">{activeSessions.length}</p>
          </CardContent>
        </Card>
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t.statTotalSessions}</p>
            <p className="text-3xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t.statThisMonth}</p>
            <p className="text-3xl font-bold">
              {sessions.filter((s) => s.date.startsWith(new Date().toISOString().slice(0, 7))).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t.currentlyActive}</h2>
          {activeSessions.map((s, i) => (
            <div
              key={s.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <SessionCard session={s} isAdmin={isAdmin} t={t} statusLabel={statusLabel} />
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/players" className={cn(buttonVariants({ variant: 'outline' }), 'h-16 flex-col gap-1 transition-transform hover:-translate-y-0.5 active:scale-95')}>
          <Users className="h-5 w-5" />
          <span>{t.managePlayers}</span>
        </Link>
        <Link href="/ranking" className={cn(buttonVariants({ variant: 'outline' }), 'h-16 flex-col gap-1 transition-transform hover:-translate-y-0.5 active:scale-95')}>
          <Trophy className="h-5 w-5" />
          <span>{t.monthlyRanking}</span>
        </Link>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t.sessionHistory}</h2>
          {recentSessions.map((s, i) => (
            <div
              key={s.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <SessionCard session={s} isAdmin={isAdmin} t={t} statusLabel={statusLabel} />
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="animate-in fade-in duration-500 text-center py-12 text-muted-foreground">
          <p className="text-lg">{t.noSessions}</p>
          <p className="text-sm mt-1">{t.noSessionsHint}</p>
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session, isAdmin, t, statusLabel,
}: {
  session: Session
  isAdmin: boolean
  t: Translations
  statusLabel: Record<Session['status'], string>
}) {
  const href = (session.status === 'finished' ? `/session/${session.id}/result` : `/session/${session.id}`) as Route
  const label = `${formatDate(session.date, t.dateLocale)} ${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)}`

  return (
    <Card className="hover:bg-accent/40 transition-colors">
      <CardContent className="py-3 px-4 flex items-center gap-2">
        <Link href={href} className="flex-1 flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="font-semibold truncate">{formatDate(session.date, t.dateLocale)}</p>
            <p className="text-sm text-muted-foreground">
              {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)} · {session.total_courts} {t.courts}
              {session.total_rounds ? ` · ${session.current_round}/${session.total_rounds} ${t.roundLabel.toLowerCase()}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <Badge variant={STATUS_VARIANT[session.status]}>{statusLabel[session.status]}</Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
        {isAdmin && (
          <DeleteSessionButton sessionId={session.id} sessionLabel={label} confirmMsg={t.deleteSessionConfirm(label)} />
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
