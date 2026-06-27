import { Suspense } from 'react'
import { getPlayers } from '@/lib/actions/players'
import { getUser } from '@/lib/actions/auth'
import { getT } from '@/lib/i18n/server'
import { PlayerTable } from '@/components/players/PlayerTable'
import { AddPlayerButton } from '@/components/players/AddPlayerButton'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
  const [players, user, t] = await Promise.all([getPlayers(), getUser(), Promise.resolve(getT())])
  const isAdmin = !!user

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.playersTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.playersCount(players.length)}</p>
        </div>
        {isAdmin && <AddPlayerButton />}
      </div>

      <Separator />

      <Suspense fallback={<p className="text-muted-foreground text-sm">{t.loadingText}</p>}>
        <PlayerTable players={players} isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}
