'use client'

import { useTransition, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createSession } from '@/lib/actions/sessions'
import { toast } from 'sonner'
import type { Player } from '@/types/database'
import { Check } from 'lucide-react'

interface Props {
  players: Player[]
}

export function NewSessionForm({ players }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())

  const today = new Date().toISOString().split('T')[0]

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    selectedPlayerIds.forEach((id) => formData.append('player_ids', id))
    startTransition(async () => {
      try {
        await createSession(formData)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.toastErrorCreateSession)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="date">{t.dateLabel}</Label>
        <Input id="date" name="date" type="date" defaultValue={today} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="total_courts">{t.courtsLabel}</Label>
        <Input id="total_courts" name="total_courts" type="number" min={1} max={10} defaultValue={2} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_time">{t.startTimeLabel}</Label>
          <Input id="start_time" name="start_time" type="time" defaultValue="08:00" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_time">{t.endTimeLabel}</Label>
          <Input id="end_time" name="end_time" type="time" defaultValue="10:00" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="match_duration">{t.matchDurationLabel}</Label>
        <Input id="match_duration" name="match_duration" type="number" min={5} max={60} defaultValue={15} required />
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t.presentPlayersLabel}</Label>
          <span className="text-sm text-muted-foreground">{t.selectedCount(selectedPlayerIds.size)}</span>
        </div>

        {players.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.noActivePlayers}</p>
        )}

        <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
          {players.map((p) => {
            const selected = selectedPlayerIds.has(p.id)
            return (
              <Card
                key={p.id}
                className={`cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'}`}
                onClick={() => togglePlayer(p.id)}
              >
                <CardContent className="py-2 px-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selected
                      ? <Check className="h-4 w-4 text-primary" />
                      : <div className="h-4 w-4 rounded border border-input" />
                    }
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <Badge variant="secondary">Lvl {p.level}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Button type="submit" disabled={isPending || selectedPlayerIds.size < 4} className="w-full h-12 text-base">
        {isPending ? t.creatingSession : t.createSessionBtn}
      </Button>
      {selectedPlayerIds.size < 4 && (
        <p className="text-xs text-muted-foreground text-center -mt-2">{t.minPlayersHint}</p>
      )}
    </form>
  )
}
