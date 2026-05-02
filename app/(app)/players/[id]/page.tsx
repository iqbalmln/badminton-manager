import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trophy, Swords, CalendarDays, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player, Session, SessionPlayer, Match } from '@/types/database'

export const dynamic = 'force-dynamic'

interface SessionHistoryRow extends SessionPlayer {
  session: Session
}

interface MatchWithPlayers extends Match {
  team_a_player1_data: Player
  team_a_player2_data: Player
  team_b_player1_data: Player
  team_b_player2_data: Player
}

interface Props {
  params: { id: string }
}

export default async function PlayerHistoryPage({ params }: Props) {
  const playerId = params.id
  const t = getT()
  const supabase = createServiceClient()

  const [{ data: player, error }, { data: rawHistory }, { data: rawMatches }] = await Promise.all([
    supabase.from('players').select('*').eq('id', playerId).single(),
    supabase
      .from('session_players')
      .select('*, session:sessions(*)')
      .eq('player_id', playerId),
    supabase
      .from('matches')
      .select(`
        *,
        team_a_player1_data:players!matches_team_a_player1_fkey(*),
        team_a_player2_data:players!matches_team_a_player2_fkey(*),
        team_b_player1_data:players!matches_team_b_player1_fkey(*),
        team_b_player2_data:players!matches_team_b_player2_fkey(*)
      `)
      .eq('status', 'finished')
      .or([
        `team_a_player1.eq.${playerId}`,
        `team_a_player2.eq.${playerId}`,
        `team_b_player1.eq.${playerId}`,
        `team_b_player2.eq.${playerId}`,
      ].join(',')),
  ])

  if (error || !player) notFound()

  const history = ((rawHistory ?? []) as unknown as SessionHistoryRow[])
    .filter((row) => row.session?.status === 'finished')
    .sort((a, b) => (a.session.date < b.session.date ? 1 : -1))

  const matches = (rawMatches ?? []) as unknown as MatchWithPlayers[]

  // Group matches by session_id
  const matchesBySession = new Map<string, MatchWithPlayers[]>()
  for (const m of matches) {
    const list = matchesBySession.get(m.session_id) ?? []
    list.push(m)
    matchesBySession.set(m.session_id, list)
  }

  // --- Chemistry stats ---
  type PersonStat = { id: string; name: string; played: number; wins: number }
  const partnerMap = new Map<string, PersonStat>()
  const opponentMap = new Map<string, PersonStat>()

  for (const m of matches) {
    const onTeamA = m.team_a_player1 === playerId || m.team_a_player2 === playerId
    const myWin = (onTeamA && m.winner === 'team_a') || (!onTeamA && m.winner === 'team_b')

    const partner = onTeamA
      ? (m.team_a_player1 === playerId ? m.team_a_player2_data : m.team_a_player1_data)
      : (m.team_b_player1 === playerId ? m.team_b_player2_data : m.team_b_player1_data)

    const opps = onTeamA
      ? [m.team_b_player1_data, m.team_b_player2_data]
      : [m.team_a_player1_data, m.team_a_player2_data]

    // Partner
    const ps = partnerMap.get(partner.id) ?? { id: partner.id, name: partner.name, played: 0, wins: 0 }
    ps.played++
    if (myWin) ps.wins++
    partnerMap.set(partner.id, ps)

    // Opponents
    for (const opp of opps) {
      const os = opponentMap.get(opp.id) ?? { id: opp.id, name: opp.name, played: 0, wins: 0 }
      os.played++
      if (myWin) os.wins++
      opponentMap.set(opp.id, os)
    }
  }

  const partnerStats = [...partnerMap.values()]
    .filter((p) => p.played >= 2)
    .sort((a, b) => b.wins / b.played - a.wins / a.played || b.played - a.played)

  const opponentStats = [...opponentMap.values()].filter((p) => p.played >= 2)
  const toughOpponents = [...opponentStats].sort((a, b) => a.wins / a.played - b.wins / b.played || b.played - a.played).slice(0, 5)
  const weakOpponents = [...opponentStats].sort((a, b) => b.wins / b.played - a.wins / a.played || b.played - a.played).slice(0, 5)

  // Lifetime stats
  const totalSessions = history.length
  const totalMatches = history.reduce((s, r) => s + r.total_matches, 0)
  const totalWins = history.reduce((s, r) => s + r.total_wins, 0)
  const totalLosses = totalMatches - totalWins
  const totalPoints = totalWins * 3 + totalLosses * 1
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-5">
      {/* Back + player info */}
      <div className="flex items-center gap-2">
        <Link href="/players" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold leading-tight">{(player as Player).name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary">Lvl {(player as Player).level}</Badge>
            <Badge variant={(player as Player).is_active ? 'default' : 'outline'}>
              {(player as Player).is_active ? t.statusActiveLabel : t.statusInactiveLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<CalendarDays className="h-4 w-4" />} label={t.statSessions} value={totalSessions} />
        <StatCard icon={<Swords className="h-4 w-4" />} label={t.statMatches} value={totalMatches} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label={t.statWins} value={totalWins} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={t.statWinRate} value={`${winRate}%`} />
      </div>

      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
        <span className="text-sm text-muted-foreground">{t.totalPoints}</span>
        <span className="text-2xl font-bold ml-auto">{totalPoints}</span>
        <span className="text-xs text-muted-foreground">{totalWins}{t.winAbbr} · {totalLosses}{t.lossAbbr}</span>
      </div>

      {/* Chemistry stats */}
      {(partnerStats.length > 0 || toughOpponents.length > 0) && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t.chemistryTitle}
            </h2>

            {/* Partner stats */}
            {partnerStats.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{t.partnersLabel}</p>
                {partnerStats.slice(0, 5).map((p) => {
                  const wr = Math.round((p.wins / p.played) * 100)
                  return (
                    <div key={p.id} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 truncate font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-xs">{p.played}M · {p.wins}W</span>
                      <WinRateBar value={wr} />
                      <span className="w-9 text-right font-mono text-xs font-semibold">{wr}%</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Opponent stats */}
            {(toughOpponents.length > 0 || weakOpponents.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {toughOpponents.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{t.toughOpponents}</p>
                    {toughOpponents.slice(0, 3).map((o) => {
                      const wr = Math.round((o.wins / o.played) * 100)
                      return (
                        <div key={o.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{o.name}</span>
                          <span className="text-xs text-muted-foreground">{o.played}M</span>
                          <span className="text-xs font-mono font-semibold text-red-500">{wr}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {weakOpponents.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{t.favoriteOpponents}</p>
                    {weakOpponents.slice(0, 3).map((o) => {
                      const wr = Math.round((o.wins / o.played) * 100)
                      return (
                        <div key={o.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{o.name}</span>
                          <span className="text-xs text-muted-foreground">{o.played}M</span>
                          <span className="text-xs font-mono font-semibold text-green-600">{wr}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Session history */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t.sessionHistory}
        </h2>

        {history.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t.noFinishedSessions}
          </p>
        )}

        {history.map((row) => {
          const wins = row.total_wins
          const losses = row.total_matches - row.total_wins
          const pts = wins * 3 + losses * 1
          const sessionMatches = (matchesBySession.get(row.session_id) ?? [])
            .sort((a, b) => a.round_number - b.round_number)

          return (
            <Card key={row.id}>
              <CardContent className="py-3 px-4 space-y-3">
                {/* Session header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{formatDate(row.session.date, t.dateLocale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.session.start_time.slice(0, 5)}–{row.session.end_time.slice(0, 5)}
                      {' · '}{row.session.total_courts} {t.courts}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{row.total_matches}{t.matchAbbr}</span>
                    <span className="text-xs text-green-600 font-medium">{wins}{t.winAbbr}</span>
                    <span className="text-xs text-red-500 font-medium">{losses}{t.lossAbbr}</span>
                    <Badge variant="secondary" className="font-bold">{pts} {t.pts}</Badge>
                  </div>
                </div>

                {/* Per-match detail */}
                {sessionMatches.length > 0 && (
                  <div className="space-y-1.5 border-t pt-2.5">
                    {sessionMatches.map((m) => {
                      const onTeamA = m.team_a_player1 === playerId || m.team_a_player2 === playerId
                      const partner = onTeamA
                        ? (m.team_a_player1 === playerId ? m.team_a_player2_data : m.team_a_player1_data)
                        : (m.team_b_player1 === playerId ? m.team_b_player2_data : m.team_b_player1_data)
                      const opp1 = onTeamA ? m.team_b_player1_data : m.team_a_player1_data
                      const opp2 = onTeamA ? m.team_b_player2_data : m.team_a_player2_data
                      const myTeamWon = (onTeamA && m.winner === 'team_a') || (!onTeamA && m.winner === 'team_b')
                      const score = onTeamA
                        ? `${m.score_a ?? '?'}–${m.score_b ?? '?'}`
                        : `${m.score_b ?? '?'}–${m.score_a ?? '?'}`

                      return (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <Badge
                            variant={myTeamWon ? 'default' : 'outline'}
                            className={cn(
                              'w-5 h-5 p-0 flex items-center justify-center text-[10px] font-bold shrink-0',
                              !myTeamWon && 'text-muted-foreground'
                            )}
                          >
                            {myTeamWon ? t.winAbbr : t.lossAbbr}
                          </Badge>
                          <span className="text-muted-foreground">R{m.round_number}</span>
                          <span className="font-medium truncate">
                            + {partner.name}
                          </span>
                          <span className="text-muted-foreground shrink-0">vs</span>
                          <span className="truncate text-muted-foreground">
                            {opp1.name} & {opp2.name}
                          </span>
                          <span className="ml-auto font-mono shrink-0 font-medium">
                            {score}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function WinRateBar({ value }: { value: number }) {
  const color = value >= 60 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
