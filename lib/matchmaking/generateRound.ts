'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { Match, SessionPlayer, Player, SessionConfig } from '@/types/database'

// ----------------------------------------------------------------
// Tier configs (CLAUDE.md business rules)
// ----------------------------------------------------------------

interface TierConfig {
  levelDiffMax: number
  partnerAvoidRounds: number
  opponentAvoidRounds: number
}

const TIERS: Record<number, TierConfig> = {
  1: { levelDiffMax: 2, partnerAvoidRounds: 3, opponentAvoidRounds: 2 },
  2: { levelDiffMax: 3, partnerAvoidRounds: 2, opponentAvoidRounds: 1 },
  3: { levelDiffMax: 4, partnerAvoidRounds: 1, opponentAvoidRounds: 0 },
  4: { levelDiffMax: 5, partnerAvoidRounds: 0, opponentAvoidRounds: 0 },
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

type PlayerWithLevel = SessionPlayer & { player: Player }

/** All combinations of r items from array */
function combinations<T>(arr: T[], r: number): T[][] {
  if (r === 0) return [[]]
  if (arr.length < r) return []
  const [first, ...rest] = arr
  const withFirst = combinations(rest, r - 1).map((c) => [first, ...c])
  const withoutFirst = combinations(rest, r)
  return [...withFirst, ...withoutFirst]
}

/** Build pair → recent rounds map from match history */
function buildHistoryMaps(
  matches: Match[],
  currentRound: number,
): {
  partnerMap: Map<string, number>   // "p1:p2" → last round as partners
  opponentMap: Map<string, number>  // "p1:p2" → last round as opponents
} {
  const partnerMap = new Map<string, number>()
  const opponentMap = new Map<string, number>()

  function pairKey(a: string, b: string) {
    return [a, b].sort().join(':')
  }

  for (const m of matches) {
    const round = m.round_number
    // Partners
    for (const [p1, p2] of [
      [m.team_a_player1, m.team_a_player2],
      [m.team_b_player1, m.team_b_player2],
    ]) {
      const key = pairKey(p1, p2)
      if (!partnerMap.has(key) || partnerMap.get(key)! < round) {
        partnerMap.set(key, round)
      }
    }
    // Opponents
    for (const p1 of [m.team_a_player1, m.team_a_player2]) {
      for (const p2 of [m.team_b_player1, m.team_b_player2]) {
        const key = pairKey(p1, p2)
        if (!opponentMap.has(key) || opponentMap.get(key)! < round) {
          opponentMap.set(key, round)
        }
      }
    }
  }

  return { partnerMap, opponentMap }
}

/** Check if 4 players form a valid group under given tier constraints */
function isValidGroup(
  group: PlayerWithLevel[],
  currentRound: number,
  partnerMap: Map<string, number>,
  opponentMap: Map<string, number>,
  tier: TierConfig,
): boolean {
  const levels = group.map((p) => p.player.level)
  if (Math.max(...levels) - Math.min(...levels) > tier.levelDiffMax) return false

  function pairKey(a: string, b: string) {
    return [a, b].sort().join(':')
  }

  // Tim A: P1+P4, Tim B: P2+P3 (balanced assignment)
  const sorted = [...group].sort((a, b) => b.player.level - a.player.level)
  const teamA = [sorted[0], sorted[3]]
  const teamB = [sorted[1], sorted[2]]

  // Partner constraints
  if (tier.partnerAvoidRounds > 0) {
    for (const [t, members] of [[teamA, teamA], [teamB, teamB]] as [PlayerWithLevel[], PlayerWithLevel[]][]) {
      const key = pairKey(t[0].player_id, t[1].player_id)
      const lastRound = partnerMap.get(key) ?? 0
      if (currentRound - lastRound <= tier.partnerAvoidRounds) return false
    }
  }

  // Opponent constraints
  if (tier.opponentAvoidRounds > 0) {
    for (const pa of teamA) {
      for (const pb of teamB) {
        const key = pairKey(pa.player_id, pb.player_id)
        const lastRound = opponentMap.get(key) ?? 0
        if (currentRound - lastRound <= tier.opponentAvoidRounds) return false
      }
    }
  }

  return true
}

// ----------------------------------------------------------------
// Main export
// ----------------------------------------------------------------

export async function generateRound(sessionId: string, roundNumber: number): Promise<void> {
  const supabase = createServiceClient()

  // Load session config
  const { data: configData } = await supabase
    .from('session_config')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  const config: SessionConfig | null = configData

  // Load active players for this round
  const { data: spRows, error: spErr } = await supabase
    .from('session_players')
    .select('*, player:players(*)')
    .eq('session_id', sessionId)
    .lte('joined_at_round', roundNumber)
    .or(`left_at_round.is.null,left_at_round.gt.${roundNumber}`)

  if (spErr) throw new Error(spErr.message)

  const activePlayers = (spRows as unknown as PlayerWithLevel[]).sort((a, b) => {
    if (a.last_played_round !== b.last_played_round) return a.last_played_round - b.last_played_round
    return a.player.level - b.player.level
  })

  // Load session to get total_courts
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('total_courts')
    .eq('id', sessionId)
    .single()

  const totalCourts: number = sessionData?.total_courts ?? 1
  const courtsThisRound = Math.min(totalCourts, Math.floor(activePlayers.length / 4))

  if (courtsThisRound === 0) throw new Error('Pemain tidak cukup untuk membuat match (min 4 pemain)')

  const playersToPlay = activePlayers.slice(0, courtsThisRound * 4)
  const sittingOut = activePlayers.slice(courtsThisRound * 4)

  // Load match history for this session
  const { data: matchHistory } = await supabase
    .from('matches')
    .select('*')
    .eq('session_id', sessionId)

  const history: Match[] = matchHistory ?? []

  // Try from tier 1 upward
  let assignedMatches: Array<{ court: number; group: PlayerWithLevel[] }> | null = null

  for (let tier = 1; tier <= 4; tier++) {
    const effectiveTier: TierConfig = config
      ? {
          levelDiffMax: config.level_diff_max + (tier - 1),
          partnerAvoidRounds: Math.max(0, config.partner_avoid_rounds - (tier - 1)),
          opponentAvoidRounds: Math.max(0, config.opponent_avoid_rounds - (tier - 1)),
        }
      : TIERS[tier]

    const { partnerMap, opponentMap } = buildHistoryMaps(history, roundNumber)

    // Try to partition playersToPlay into courtsThisRound groups of 4
    const result = assignCourts(playersToPlay, courtsThisRound, roundNumber, partnerMap, opponentMap, effectiveTier)
    if (result) {
      assignedMatches = result
      break
    }
  }

  if (!assignedMatches) throw new Error('Tidak dapat membuat jadwal match')

  // Insert matches
  const matchInserts = assignedMatches.map(({ court, group }) => {
    const sorted = [...group].sort((a, b) => b.player.level - a.player.level)
    return {
      session_id: sessionId,
      round_number: roundNumber,
      court_number: court,
      team_a_player1: sorted[0].player_id,
      team_a_player2: sorted[3].player_id,
      team_b_player1: sorted[1].player_id,
      team_b_player2: sorted[2].player_id,
      status: 'pending' as const,
    }
  })

  const { error: insertErr } = await supabase.from('matches').insert(matchInserts)
  if (insertErr) throw new Error(insertErr.message)

  // Update last_played_round for players who played
  const playingIds = playersToPlay.map((p) => p.player_id)
  await supabase
    .from('session_players')
    .update({ last_played_round: roundNumber })
    .eq('session_id', sessionId)
    .in('player_id', playingIds)

  // Update rounds_sat_out for sitting-out players
  if (sittingOut.length > 0) {
    const sitIds = sittingOut.map((p) => p.player_id)
    // Increment rounds_sat_out individually via rpc isn't available so we do a loop
    for (const sp of sittingOut) {
      await supabase
        .from('session_players')
        .update({ rounds_sat_out: sp.rounds_sat_out + 1 })
        .eq('session_id', sessionId)
        .eq('player_id', sp.player_id)
    }
  }

  // Advance current_round
  await supabase
    .from('sessions')
    .update({ current_round: roundNumber })
    .eq('id', sessionId)
}

// ----------------------------------------------------------------
// Court assignment helper
// ----------------------------------------------------------------

function assignCourts(
  players: PlayerWithLevel[],
  numCourts: number,
  currentRound: number,
  partnerMap: Map<string, number>,
  opponentMap: Map<string, number>,
  tier: TierConfig,
): Array<{ court: number; group: PlayerWithLevel[] }> | null {
  if (numCourts === 0) return []

  const groupCombos = combinations(players, 4)
  for (const group of groupCombos) {
    if (!isValidGroup(group, currentRound, partnerMap, opponentMap, tier)) continue
    const remaining = players.filter((p) => !group.includes(p))
    const rest = assignCourts(remaining, numCourts - 1, currentRound, partnerMap, opponentMap, tier)
    if (rest !== null) {
      return [{ court: numCourts, group }, ...rest]
    }
  }
  return null
}
