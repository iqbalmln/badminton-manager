'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlayerForm } from './PlayerForm'
import { createPlayer } from '@/lib/actions/players'
import { Plus } from 'lucide-react'

export function AddPlayerButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Tambah Pemain
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pemain Baru</DialogTitle>
        </DialogHeader>
        <PlayerForm onSubmit={createPlayer} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
