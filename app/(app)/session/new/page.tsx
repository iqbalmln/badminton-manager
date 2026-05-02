import { getPlayers } from '@/lib/actions/players'
import { getT } from '@/lib/i18n/server'
import { NewSessionForm } from '@/components/session/NewSessionForm'

export const dynamic = 'force-dynamic'

export default async function NewSessionPage() {
  const [players, t] = await Promise.all([getPlayers(), Promise.resolve(getT())])
  const activePlayers = players.filter((p) => p.is_active)

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t.newSessionTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.newSessionSubtitle}</p>
      </div>
      <NewSessionForm players={activePlayers} />
    </div>
  )
}
