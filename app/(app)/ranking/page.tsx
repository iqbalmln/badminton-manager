import { createServiceClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, Trophy } from 'lucide-react'
import type { MonthlyRankingRow } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  const t = getT()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('monthly_ranking')
    .select('*')
    .order('month', { ascending: false })
    .order('points', { ascending: false })

  if (error) throw new Error(error.message)
  const rows = (data ?? []) as MonthlyRankingRow[]

  const grouped = new Map<string, MonthlyRankingRow[]>()
  for (const row of rows) {
    const month = row.month
    if (!grouped.has(month)) grouped.set(month, [])
    grouped.get(month)!.push(row)
  }

  const months = Array.from(grouped.keys())

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {t.rankingTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.rankingSubtitle}</p>
        </div>
      </div>

      {months.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t.noFinishedSessionsRanking}</p>
        </div>
      )}

      {months.map((month, monthIdx) => {
        const monthRows = grouped.get(month)!
        const monthLabel = formatMonth(month, t.dateLocale)
        const isCurrentMonth = month.startsWith(new Date().toISOString().slice(0, 7))

        return (
          <div key={month} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{monthLabel}</h2>
              {isCurrentMonth && <Badge>{t.thisMonthBadge}</Badge>}
            </div>

            {monthRows.length >= 1 && (
              <div className="grid grid-cols-3 gap-2">
                {[1, 0, 2].map((idx) => {
                  const row = monthRows[idx]
                  if (!row) return <div key={idx} />
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <Card key={row.player_id} className={idx === 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30' : ''}>
                      <CardContent className="py-3 px-2 text-center">
                        <p className="text-xl">{medals[idx]}</p>
                        <p className="font-bold text-xs leading-tight truncate">{row.name}</p>
                        <p className="text-2xl font-black">{row.points}</p>
                        <p className="text-xs text-muted-foreground">{t.pts}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>{t.colPlayer}</TableHead>
                  <TableHead className="text-center w-12">{t.colSessions}</TableHead>
                  <TableHead className="text-center w-12">{t.winAbbr}</TableHead>
                  <TableHead className="text-center w-12">{t.lossAbbr}</TableHead>
                  <TableHead className="text-right w-16">{t.pts}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthRows.map((row, i) => (
                  <TableRow key={row.player_id} className={i === 0 ? 'bg-yellow-50 dark:bg-yellow-950/30 font-semibold' : ''}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium">{row.name}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">Lvl {row.level}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{row.sessions_played}</TableCell>
                    <TableCell className="text-center text-blue-600">{row.total_wins}</TableCell>
                    <TableCell className="text-center text-orange-500">{row.total_losses}</TableCell>
                    <TableCell className="text-right font-bold">{row.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {monthIdx < months.length - 1 && <Separator />}
          </div>
        )
      })}
    </div>
  )
}

function formatMonth(isoTimestamp: string, locale: string) {
  return new Date(isoTimestamp).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}
