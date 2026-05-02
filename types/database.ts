/**
 * TypeScript types generated from schema.sql
 * Reflects the Supabase PostgreSQL schema for Badminton Session Manager.
 */

// ----------------------------------------------------------------
// Enums / Union types
// ----------------------------------------------------------------

export type SessionStatus = 'draft' | 'active' | 'finished'
export type MatchStatus = 'pending' | 'ongoing' | 'finished'
export type MatchWinner = 'team_a' | 'team_b' | 'draw'

// ----------------------------------------------------------------
// Table row types (as stored in the DB)
// ----------------------------------------------------------------

export type Player = {
  id: string
  name: string
  /** Integer 1–10 */
  level: number
  is_active: boolean
  created_at: string
}

export type Session = {
  id: string
  /** ISO date string, e.g. "2024-01-15" */
  date: string
  total_courts: number
  /** HH:MM:SS */
  start_time: string
  /** HH:MM:SS */
  end_time: string
  /** Minutes per match */
  match_duration: number
  /** Computed on session start */
  total_rounds: number | null
  current_round: number
  status: SessionStatus
  created_at: string
}

export type SessionConfig = {
  id: string
  session_id: string
  level_diff_max: number
  partner_avoid_rounds: number
  opponent_avoid_rounds: number
}

export type SessionPlayer = {
  id: string
  session_id: string
  player_id: string
  /** Round from which the player starts participating */
  joined_at_round: number
  /** Null = plays until the end */
  left_at_round: number | null
  /** 0 = hasn't played yet in this session */
  last_played_round: number
  rounds_sat_out: number
  total_matches: number
  total_wins: number
}

export type Match = {
  id: string
  session_id: string
  round_number: number
  court_number: number
  team_a_player1: string
  team_a_player2: string
  team_b_player1: string
  team_b_player2: string
  score_a: number | null
  score_b: number | null
  winner: MatchWinner | null
  status: MatchStatus
  created_at: string
}

// ----------------------------------------------------------------
// View row types
// ----------------------------------------------------------------

export type SessionLeaderboardRow = {
  session_id: string
  player_id: string
  name: string
  level: number
  total_matches: number
  total_wins: number
  total_losses: number
  /** Wins × 3 + Losses × 1 */
  points: number
}

export type MonthlyRankingRow = {
  /** ISO timestamp of the first day of the month */
  month: string
  player_id: string
  name: string
  level: number
  sessions_played: number
  total_matches: number
  total_wins: number
  total_losses: number
  points: number
}

// Inline relationship type so we don't need to import from supabase-js
type Rel = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

// ----------------------------------------------------------------
// Supabase Database type (for createClient<Database>())
// ----------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      players: {
        Row: Player
        Insert: {
          id?: string
          name: string
          level: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<{ name: string; level: number; is_active: boolean }>
        Relationships: Rel[]
      }
      sessions: {
        Row: Session
        Insert: {
          id?: string
          date?: string
          total_courts: number
          start_time: string
          end_time: string
          match_duration?: number
          total_rounds?: number | null
          current_round?: number
          status?: SessionStatus
          created_at?: string
        }
        Update: Partial<Omit<Session, 'id' | 'created_at'>>
        Relationships: Rel[]
      }
      session_config: {
        Row: SessionConfig
        Insert: {
          id?: string
          session_id: string
          level_diff_max?: number
          partner_avoid_rounds?: number
          opponent_avoid_rounds?: number
        }
        Update: Partial<Omit<SessionConfig, 'id' | 'session_id'>>
        Relationships: Rel[]
      }
      session_players: {
        Row: SessionPlayer
        Insert: {
          id?: string
          session_id: string
          player_id: string
          joined_at_round?: number
          left_at_round?: number | null
          last_played_round?: number
          rounds_sat_out?: number
          total_matches?: number
          total_wins?: number
        }
        Update: Partial<Omit<SessionPlayer, 'id' | 'session_id' | 'player_id'>>
        Relationships: Rel[]
      }
      matches: {
        Row: Match
        Insert: {
          id?: string
          session_id: string
          round_number: number
          court_number: number
          team_a_player1: string
          team_a_player2: string
          team_b_player1: string
          team_b_player2: string
          score_a?: number | null
          score_b?: number | null
          winner?: MatchWinner | null
          status?: MatchStatus
          created_at?: string
        }
        Update: Partial<Omit<Match, 'id' | 'created_at' | 'session_id' | 'round_number' | 'court_number'>>
        Relationships: Rel[]
      }
    }
    Views: {
      session_leaderboard: {
        Row: SessionLeaderboardRow
        Relationships: Rel[]
      }
      monthly_ranking: {
        Row: MonthlyRankingRow
        Relationships: Rel[]
      }
    }
    Functions: {
      update_match_stats: {
        Args: {
          p_match_id: string
          p_score_a: number
          p_score_b: number
        }
        Returns: undefined
      }
      calculate_total_rounds: {
        Args: {
          p_start_time: string
          p_end_time: string
          p_match_duration: number
        }
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
