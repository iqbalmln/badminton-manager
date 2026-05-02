'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteSession } from '@/lib/actions/sessions'
import { Trash2 } from 'lucide-react'

interface Props {
  sessionId: string
  sessionLabel: string
  confirmMsg: string
}

export function DeleteSessionButton({ sessionId, sessionLabel, confirmMsg }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(confirmMsg)) return
    setLoading(true)
    await deleteSession(sessionId)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
      disabled={loading}
      onClick={handleDelete}
      title="Hapus sesi"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
