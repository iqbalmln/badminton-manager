'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { generateRound } from '@/lib/matchmaking/generateRound'
import { requireAdmin } from '@/lib/actions/auth'
import type { Match, Player } from '@/types/database'
import type { MatchWithPlayers } from '@/types'

export async function getMatchesForRound(sessionId: string, roundNumber: number): Promise<MatchWithPlayers[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      team_a_player1_data:players!matches_team_a_player1_fkey(*),
      team_a_player2_data:players!matches_team_a_player2_fkey(*),
      team_b_player1_data:players!matches_team_b_player1_fkey(*),
      team_b_player2_data:players!matches_team_b_player2_fkey(*)
    `)
    .eq('session_id', sessionId)
    .eq('round_number', roundNumber)
    .order('court_number')

  if (error) throw new Error(error.message)
  return data as unknown as MatchWithPlayers[]
}

export async function generateNextRound(sessionId: string, roundNumber: number) {
  await requireAdmin()
  await generateRound(sessionId, roundNumber)
  revalidatePath(`/session/${sessionId}`)
}

export async function submitScore(matchId: string, scoreA: number, scoreB: number, sessionId: string) {
  await requireAdmin()
  const supabase = createServiceClient()

  const { error } = await supabase.rpc('update_match_stats', {
    p_match_id: matchId,
    p_score_a: scoreA,
    p_score_b: scoreB,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/session/${sessionId}`)
}

export async function getAllMatchesForSession(sessionId: string): Promise<Match[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('session_id', sessionId)
    .order('round_number')
    .order('court_number')

  if (error) throw new Error(error.message)
  return data
}
