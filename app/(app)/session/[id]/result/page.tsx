import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/actions/sessions'
import { getT } from '@/lib/i18n/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ArrowLeft, Trophy } from 'lucide-react'
import type { SessionLeaderboardRow } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function SessionResultPage({ params }: Props) {
  const t = getT()

  let session
  try {
    session = await getSession(params.id)
  } catch {
    notFound()
  }

  const supabase = createServiceClient()
  const { data: leaderboard, error } = await supabase
    .from('session_leaderboard')
    .select('*')
    .eq('session_id', params.id)

  if (error) throw new Error(error.message)
  const rows = (leaderboard ?? []) as SessionLeaderboardRow[]

  const { data: matchesData } = await supabase
    .from('matches')
    .select('round_number')
    .eq('session_id', params.id)
    .eq('status', 'finished')

  const totalMatches = matchesData?.length ?? 0
  const rounds = matchesData && matchesData.length > 0
    ? Math.max(...(matchesData as { round_number: number }[]).map((m) => m.round_number))
    : 0

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-5">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-center gap-2">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t.sessionResultTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(session.date, t.dateLocale)} · {rounds} {t.roundLabel.toLowerCase()} · {totalMatches} {t.matchCountLabel}
          </p>
        </div>
      </div>

      {rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 0, 2].map((idx) => {
            const row = rows[idx]
            const medals = ['🥇', '🥈', '🥉']
            return (
              <Card
                key={row.player_id}
                className={`animate-in fade-in zoom-in-95 duration-500 fill-mode-both ${idx === 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30' : ''}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CardContent className="py-3 px-2 text-center">
                  <p className="text-2xl">{medals[idx]}</p>
                  <p className="font-bold text-sm leading-tight truncate">{row.name}</p>
                  <p className="text-2xl font-black">{row.points}</p>
                  <p className="text-xs text-muted-foreground">{t.pts}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Separator />

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.leaderboardLabel}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>{t.colPlayer}</TableHead>
              <TableHead className="text-center w-12">{t.matchAbbr}</TableHead>
              <TableHead className="text-center w-12">{t.winAbbr}</TableHead>
              <TableHead className="text-center w-12">{t.lossAbbr}</TableHead>
              <TableHead className="text-right w-16">{t.pts}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.player_id}
                className={`animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both ${i === 0 ? 'bg-yellow-50 dark:bg-yellow-950/30 font-semibold' : ''}`}
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <span className="font-medium">{row.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">Lvl {row.level}</Badge>
                </TableCell>
                <TableCell className="text-center">{row.total_matches}</TableCell>
                <TableCell className="text-center text-blue-600">{row.total_wins}</TableCell>
                <TableCell className="text-center text-orange-500">{row.total_losses}</TableCell>
                <TableCell className="text-right font-bold">{row.points}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t.noMatchData}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 text-center')}>
          {t.dashboardTitle}
        </Link>
        <Link href="/ranking" className={cn(buttonVariants(), 'flex-1 text-center')}>
          {t.monthlyRanking}
        </Link>
      </div>
    </div>
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
