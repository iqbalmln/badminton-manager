'use client'

import { useState, useTransition } from 'react'
import { useT } from '@/lib/i18n/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { submitScore } from '@/lib/actions/matches'
import { toast } from 'sonner'
import type { MatchWithPlayers } from '@/types'

interface Props {
  match: MatchWithPlayers
  sessionId: string
  isAdmin: boolean
}

export function MatchCard({ match, sessionId, isAdmin }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [scoreA, setScoreA] = useState(String(match.score_a ?? ''))
  const [scoreB, setScoreB] = useState(String(match.score_b ?? ''))

  const isFinished = match.status === 'finished'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sa = Number(scoreA)
    const sb = Number(scoreB)
    if (isNaN(sa) || isNaN(sb) || sa < 0 || sb < 0) {
      toast.error(t.toastInvalidScore)
      return
    }
    startTransition(async () => {
      try {
        await submitScore(match.id, sa, sb, sessionId)
        setEditing(false)
        toast.success(t.toastScoreSaved(match.court_number))
      } catch {
        toast.error(t.toastErrorSaveScore)
      }
    })
  }

  const winnerA = match.winner === 'team_a'
  const winnerB = match.winner === 'team_b'

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">Court {match.court_number}</span>
        {isFinished
          ? <Badge variant="secondary" className="text-xs">{t.badgeFinished}</Badge>
          : <Badge variant="outline" className="text-xs">{t.badgeWaiting}</Badge>
        }
      </div>

      <CardContent className="p-0">
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-4 ${winnerA ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-600 mb-0.5">{t.teamALabel}</p>
            <p className="font-semibold text-base leading-tight truncate">{match.team_a_player1_data.name}</p>
            <p className="font-semibold text-base leading-tight truncate">{match.team_a_player2_data.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lvl {match.team_a_player1_data.level} + {match.team_a_player2_data.level}
            </p>
          </div>
          <div className="text-right">
            {isFinished && (
              <span className={`text-4xl font-black tabular-nums ${winnerA ? 'text-blue-600' : 'text-muted-foreground'}`}>
                {match.score_a}
              </span>
            )}
            {winnerA && <p className="text-xs text-blue-600 font-semibold">{t.wonLabel}</p>}
          </div>
        </div>

        <div className={`px-4 py-3 flex items-center justify-between gap-4 ${winnerB ? 'bg-orange-50 dark:bg-orange-950/30' : ''}`}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-orange-500 mb-0.5">{t.teamBLabel}</p>
            <p className="font-semibold text-base leading-tight truncate">{match.team_b_player1_data.name}</p>
            <p className="font-semibold text-base leading-tight truncate">{match.team_b_player2_data.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lvl {match.team_b_player1_data.level} + {match.team_b_player2_data.level}
            </p>
          </div>
          <div className="text-right">
            {isFinished && (
              <span className={`text-4xl font-black tabular-nums ${winnerB ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {match.score_b}
              </span>
            )}
            {winnerB && <p className="text-xs text-orange-500 font-semibold">{t.wonLabel}</p>}
          </div>
        </div>

        {!isFinished && isAdmin && (
          <div className="border-t px-4 py-3">
            {!editing ? (
              <Button className="w-full" size="lg" onClick={() => setEditing(true)}>
                {t.inputScoreBtn}
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  type="number" min={0} value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="text-center text-xl font-bold h-12"
                  placeholder="A" autoFocus
                />
                <span className="text-muted-foreground font-bold">vs</span>
                <Input
                  type="number" min={0} value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="text-center text-xl font-bold h-12"
                  placeholder="B"
                />
                <Button type="submit" disabled={isPending} className="shrink-0">
                  {isPending ? '…' : t.saveScoreBtn}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)} className="shrink-0">
                  ✕
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
