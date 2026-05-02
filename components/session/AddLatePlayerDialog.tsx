'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addPlayerToSession } from '@/lib/actions/sessions'
import { UserPlus } from 'lucide-react'
import type { Player } from '@/types/database'

interface Props {
  sessionId: string
  currentRound: number
  availablePlayers: Player[]
}

export function AddLatePlayerDialog({ sessionId, currentRound, availablePlayers }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAdd(playerId: string) {
    setLoading(playerId)
    try {
      await addPlayerToSession(sessionId, playerId, currentRound + 1)
      setOpen(false)
    } finally {
      setLoading(null)
    }
  }

  if (availablePlayers.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          {t.addLatePlayerBtn}
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.addLatePlayerTitle}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t.addLatePlayerHint(currentRound + 1)}
        </p>
        <div className="space-y-2 mt-2">
          {availablePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => handleAdd(player.id)}
              disabled={loading === player.id}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border hover:bg-accent transition-colors disabled:opacity-50 text-sm"
            >
              <span className="font-medium">{player.name}</span>
              <span className="text-muted-foreground">Lvl {player.level}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
