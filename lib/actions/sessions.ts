'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/auth'
import type { Session, SessionWithConfig } from '@/types'

export async function getSessions(): Promise<Session[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getSession(id: string): Promise<SessionWithConfig> {
  const supabase = createServiceClient()
  const [{ data: session, error }, { data: config }] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('session_config').select('*').eq('session_id', id).maybeSingle(),
  ])

  if (error) throw new Error(error.message)
  return { ...session!, session_config: config ?? null } as SessionWithConfig
}

export async function createSession(formData: FormData) {
  await requireAdmin()
  const supabase = createServiceClient()

  const date = formData.get('date') as string
  const totalCourts = Number(formData.get('total_courts'))
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const matchDuration = Number(formData.get('match_duration'))

  // Calculate total rounds via DB function
  const { data: roundsData, error: roundsError } = await supabase
    .rpc('calculate_total_rounds', {
      p_start_time: startTime,
      p_end_time: endTime,
      p_match_duration: matchDuration,
    })

  if (roundsError) throw new Error(roundsError.message)

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      date,
      total_courts: totalCourts,
      start_time: startTime,
      end_time: endTime,
      match_duration: matchDuration,
      total_rounds: roundsData as number,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Insert default session_config
  await supabase.from('session_config').insert({ session_id: session.id })

  // Register selected players
  const playerIds = formData.getAll('player_ids') as string[]
  if (playerIds.length > 0) {
    await supabase.from('session_players').insert(
      playerIds.map((pid) => ({ session_id: session.id, player_id: pid })),
    )
  }

  revalidatePath('/dashboard')
  redirect(`/session/${session.id}`)
}

export async function startSession(sessionId: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'active' })
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
  revalidatePath(`/session/${sessionId}`)
}

export async function finishSession(sessionId: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'finished' })
    .eq('id', sessionId)

  if (error) throw new Error(error.message)
  revalidatePath(`/session/${sessionId}`)
  redirect(`/session/${sessionId}/result`)
}

export async function addPlayerToSession(sessionId: string, playerId: string, joinedAtRound: number = 1) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase.from('session_players').insert({
    session_id: sessionId,
    player_id: playerId,
    joined_at_round: joinedAtRound,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/session/${sessionId}`)
}

export async function removePlayerFromSession(sessionId: string, playerId: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('session_id', sessionId)
    .eq('player_id', playerId)

  if (error) throw new Error(error.message)
  revalidatePath(`/session/${sessionId}`)
}

export async function deleteSession(sessionId: string) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function setPlayerLeftAt(sessionId: string, playerId: string, leftAtRound: number) {
  await requireAdmin()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('session_players')
    .update({ left_at_round: leftAtRound })
    .eq('session_id', sessionId)
    .eq('player_id', playerId)

  if (error) throw new Error(error.message)
  revalidatePath(`/session/${sessionId}`)
}
