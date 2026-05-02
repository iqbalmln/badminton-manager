'use client'

import { useTransition, useRef } from 'react'
import { useT } from '@/lib/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Player } from '@/types/database'

interface Props {
  player?: Player
  onSubmit: (formData: FormData) => Promise<void>
  onClose: () => void
}

export function PlayerForm({ player, onSubmit, onClose }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await onSubmit(formData)
        toast.success(player ? t.toastPlayerUpdated : t.toastPlayerAdded)
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.toastErrorGeneric)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t.playerNameLabel}</Label>
        <Input
          id="name" name="name"
          placeholder={t.playerNamePlaceholder}
          defaultValue={player?.name}
          required autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="level">{t.playerLevelLabel}</Label>
        <Select name="level" defaultValue={String(player?.level ?? 5)}>
          <SelectTrigger id="level">
            <SelectValue placeholder={t.playerLevelPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
              <SelectItem key={l} value={String(l)}>
                {t.levelPrefix} {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? t.saving : player ? t.saveChanges : t.addPlayerBtn}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {t.cancel}
        </Button>
      </div>
    </form>
  )
}
