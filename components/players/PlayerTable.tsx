'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlayerForm } from './PlayerForm'
import { updatePlayer, togglePlayerActive, deletePlayer } from '@/lib/actions/players'
import { toast } from 'sonner'
import type { Player } from '@/types/database'
import { Pencil, Power, Trash2 } from 'lucide-react'

interface Props {
  players: Player[]
  isAdmin: boolean
}

export function PlayerTable({ players, isAdmin }: Props) {
  const t = useT()
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle(player: Player) {
    startTransition(async () => {
      try {
        await togglePlayerActive(player.id, player.is_active)
        toast.success(player.is_active ? t.toastPlayerDeactivated(player.name) : t.toastPlayerActivated(player.name))
      } catch {
        toast.error(t.toastErrorToggle)
      }
    })
  }

  function handleDelete(player: Player) {
    if (!confirm(t.deletePlayerConfirm(player.name))) return
    startTransition(async () => {
      try {
        await deletePlayer(player.id)
        toast.success(t.toastPlayerDeleted(player.name))
      } catch {
        toast.error(t.toastErrorDelete)
      }
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.colName}</TableHead>
            <TableHead className="w-20 text-center">{t.colLevel}</TableHead>
            <TableHead className="w-24 text-center">{t.colStatus}</TableHead>
            {isAdmin && <TableHead className="w-32 text-right">{t.colActions}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-muted-foreground py-10">
                {t.noPlayers}
              </TableCell>
            </TableRow>
          )}
          {players.map((p) => (
            <TableRow key={p.id} className={!p.is_active ? 'opacity-50' : ''}>
              <TableCell className="font-medium">
                <Link href={`/players/${p.id}`} className="hover:underline underline-offset-4">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">Lvl {p.level}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={p.is_active ? 'default' : 'outline'}>
                  {p.is_active ? t.statusActiveLabel : t.statusInactiveLabel}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditTarget(p)} title={t.editPlayer}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleToggle(p)}
                      disabled={isPending}
                      title={p.is_active ? t.deactivatePlayer : t.activatePlayer}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleDelete(p)}
                      disabled={isPending}
                      title={t.deletePlayer}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editPlayer}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <PlayerForm
              player={editTarget}
              onSubmit={(fd) => updatePlayer(editTarget.id, fd)}
              onClose={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
