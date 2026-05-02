// Re-export all database types for convenient imports
export type {
  Database,
  Player,
  Session,
  SessionConfig,
  SessionPlayer,
  Match,
  SessionLeaderboardRow,
  MonthlyRankingRow,
  SessionStatus,
  MatchStatus,
  MatchWinner,
} from './database'

// ----------------------------------------------------------------
// Composite / application-level types
// ----------------------------------------------------------------

import type { Match, Player, Session, SessionConfig, SessionPlayer } from './database'

/** Match with resolved player names for display */
export interface MatchWithPlayers extends Match {
  team_a_player1_data: Player
  team_a_player2_data: Player
  team_b_player1_data: Player
  team_b_player2_data: Player
}

/** Session player row joined with master player data */
export interface SessionPlayerWithData extends SessionPlayer {
  player: Player
}

/** Full session detail loaded for the live session page */
export interface SessionWithConfig extends Session {
  session_config: SessionConfig | null
}

/** Matchmaking tier config */
export interface MatchmakingTierConfig {
  tier: 1 | 2 | 3 | 4
  levelDiffMax: number
  partnerAvoidRounds: number
  opponentAvoidRounds: number
}

/** Point constants */
export const POINTS = {
  WIN: 3,
  LOSS: 1,
  SIT_OUT: 0,
} as const
