'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { setPlayerLeftAt } from '@/lib/actions/sessions'
import { LogOut } from 'lucide-react'

interface Props {
  sessionId: string
  playerId: string
  playerName: string
  currentRound: number
  leaveTitle: string
  confirmMsg: string
}

export function LeaveSessionButton({ sessionId, playerId, currentRound, leaveTitle, confirmMsg }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleLeave() {
    if (!confirm(confirmMsg)) return
    setLoading(true)
    try {
      await setPlayerLeftAt(sessionId, playerId, currentRound + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-destructive"
      disabled={loading}
      onClick={handleLeave}
      title={leaveTitle}
    >
      <LogOut className="h-3.5 w-3.5" />
    </Button>
  )
}
