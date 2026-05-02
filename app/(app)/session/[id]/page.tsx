import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/actions/sessions'
import { getMatchesForRound } from '@/lib/actions/matches'
import { getUser } from '@/lib/actions/auth'
import { getT } from '@/lib/i18n/server'
import { MatchCard } from '@/components/session/MatchCard'
import { RoundControls } from '@/components/session/RoundControls'
import { LeaveSessionButton } from '@/components/session/LeaveSessionButton'
import { AddLatePlayerDialog } from '@/components/session/AddLatePlayerDialog'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import type { SessionPlayerWithData } from '@/types'
import type { Player, Session } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

const STATUS_VARIANT: Record<Session['status'], 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  finished: 'secondary',
}

export default async function SessionPage({ params }: Props) {
  const t = getT()

  let session
  try {
    session = await getSession(params.id)
  } catch {
    notFound()
  }

  if (session.status === 'finished') {
    return (
      <div className="container max-w-lg mx-auto p-4 text-center py-12 space-y-4">
        <p className="text-muted-foreground">{t.sessionFinishedMsg}</p>
        <Link href={`/session/${session.id}/result`} className={buttonVariants()}>{t.viewResults}</Link>
      </div>
    )
  }

  const [currentMatches, user] = await Promise.all([
    getMatchesForRound(session.id, session.current_round),
    getUser(),
  ])
  const isAdmin = !!user

  const statusLabel: Record<Session['status'], string> = {
    draft: t.statusDraft,
    active: t.statusActive,
    finished: t.statusFinished,
  }

  const supabase = createServiceClient()
  const { data: spData } = await supabase
    .from('session_players')
    .select('*, player:players(*)')
    .eq('session_id', session.id)
    .lte('joined_at_round', session.current_round)
    .or(`left_at_round.is.null,left_at_round.gt.${session.current_round}`)

  const allActivePlayers = (spData ?? []) as unknown as SessionPlayerWithData[]

  const playingIds = new Set(
    currentMatches.flatMap((m) => [
      m.team_a_player1,
      m.team_a_player2,
      m.team_b_player1,
      m.team_b_player2,
    ]),
  )
  const sittingOut = allActivePlayers.filter((sp) => !playingIds.has(sp.player_id))

  let availableToAdd: Player[] = []
  if (isAdmin && session.status === 'active') {
    const activePlayerIds = new Set(allActivePlayers.map((sp) => sp.player_id))
    const { data: allPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('name')
    availableToAdd = ((allPlayers ?? []) as Player[]).filter((p) => !activePlayerIds.has(p.id))
  }

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{formatDate(session.date, t.dateLocale)}</h1>
            <Badge variant={STATUS_VARIANT[session.status]}>{statusLabel[session.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {session.start_time.slice(0, 5)}–{session.end_time.slice(0, 5)} · {session.total_courts} {t.courts}
          </p>
        </div>
      </div>

      {/* Round indicator */}
      {session.status === 'active' && (
        <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-2">
          <span className="font-semibold">
            {t.roundLabel} {session.current_round}
            {session.total_rounds ? ` / ${session.total_rounds}` : ''}
          </span>
          <span className="text-sm text-muted-foreground">
            {t.activePlayersCount(allActivePlayers.length)}
          </span>
        </div>
      )}

      {/* Controls */}
      <RoundControls session={session} currentMatches={currentMatches} />

      {/* Match cards */}
      {currentMatches.length > 0 && (
        <div className="space-y-3">
          {currentMatches.map((m) => (
            <MatchCard key={m.id} match={m} sessionId={session.id} />
          ))}
        </div>
      )}

      {/* Sitting out */}
      {sittingOut.length > 0 && session.status === 'active' && (
        <div className="bg-muted/50 rounded-lg px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.sittingOutTitle}</p>
          <div className="flex flex-wrap gap-2">
            {sittingOut.map((sp) => (
              <Badge key={sp.player_id} variant="outline">{sp.player.name}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Player match count */}
      {session.status === 'active' && allActivePlayers.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              {t.activePlayersTitle} ({allActivePlayers.length})
            </p>
            {isAdmin && (
              <AddLatePlayerDialog
                sessionId={session.id}
                currentRound={session.current_round}
                availablePlayers={availableToAdd}
              />
            )}
          </div>
          <div className="space-y-1">
            {[...allActivePlayers]
              .sort((a, b) => b.total_matches - a.total_matches)
              .map((sp) => (
                <div key={sp.player_id} className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-muted/50">
                  <span className="text-sm font-medium">{sp.player.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Lvl {sp.player.level}</span>
                    <span className="text-xs tabular-nums">
                      <span className="font-semibold text-primary">{sp.total_matches}</span>
                      <span className="text-muted-foreground"> {t.matchCountLabel}</span>
                    </span>
                    {isAdmin && (
                      <LeaveSessionButton
                        sessionId={session.id}
                        playerId={sp.player_id}
                        playerName={sp.player.name}
                        currentRound={session.current_round}
                        leaveTitle={t.leaveEarlyTitle}
                        confirmMsg={t.leaveConfirm(sp.player.name, session.current_round)}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Player list (draft mode) */}
      {session.status === 'draft' && allActivePlayers.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-sm font-semibold text-muted-foreground">{t.registeredPlayersTitle(allActivePlayers.length)}</p>
          <div className="flex flex-wrap gap-2">
            {allActivePlayers.map((sp) => (
              <Badge key={sp.player_id} variant="secondary">
                {sp.player.name} · Lvl {sp.player.level}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
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
