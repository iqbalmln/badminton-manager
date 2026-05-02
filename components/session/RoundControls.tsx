'use client'

import { useTransition } from 'react'
import { useT } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { generateNextRound } from '@/lib/actions/matches'
import { startSession, finishSession } from '@/lib/actions/sessions'
import { toast } from 'sonner'
import type { Session } from '@/types/database'
import type { MatchWithPlayers } from '@/types'

interface Props {
  session: Session
  currentMatches: MatchWithPlayers[]
}

export function RoundControls({ session, currentMatches }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()

  const allFinished = currentMatches.length > 0 && currentMatches.every((m) => m.status === 'finished')
  const hasMatches = currentMatches.length > 0
  const isLastRound = session.total_rounds !== null && session.current_round >= session.total_rounds

  function handleStart() {
    startTransition(async () => {
      try {
        await startSession(session.id)
        await generateNextRound(session.id, 1)
        toast.success(t.toastSessionStarted(1))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.toastErrorStart)
      }
    })
  }

  function handleNextRound() {
    const nextRound = session.current_round + 1
    startTransition(async () => {
      try {
        await generateNextRound(session.id, nextRound)
        toast.success(t.toastRoundCreated(nextRound))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.toastErrorNextRound)
      }
    })
  }

  function handleFinish() {
    if (!confirm(t.endSessionConfirm)) return
    startTransition(async () => {
      try {
        await finishSession(session.id)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.toastErrorEnd)
      }
    })
  }

  if (session.status === 'draft') {
    return (
      <Button onClick={handleStart} disabled={isPending} size="lg" className="w-full h-14 text-lg">
        {isPending ? t.startingSession : t.startSessionBtn}
      </Button>
    )
  }

  if (session.status === 'active') {
    return (
      <div className="flex gap-2">
        {allFinished && !isLastRound && (
          <Button onClick={handleNextRound} disabled={isPending} size="lg" className="flex-1 h-14 text-base">
            {isPending ? t.creatingRound : t.nextRoundBtn(session.current_round + 1)}
          </Button>
        )}
        {(allFinished || isLastRound) && (
          <Button onClick={handleFinish} disabled={isPending} variant="destructive" size="lg" className="flex-1 h-14 text-base">
            {isPending ? t.endingSession : t.endSessionBtn}
          </Button>
        )}
        {!hasMatches && (
          <Button onClick={handleNextRound} disabled={isPending} size="lg" className="w-full h-14 text-base">
            {isPending ? t.creatingRound : t.generateRoundBtn(session.current_round)}
          </Button>
        )}
      </div>
    )
  }

  return null
}
