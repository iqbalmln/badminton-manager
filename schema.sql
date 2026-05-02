-- ============================================================
-- Badminton Session Manager — Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PLAYERS
-- Master data pemain komunitas
-- ============================================================
CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  level       INTEGER NOT NULL CHECK (level BETWEEN 1 AND 10),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- Satu sesi = satu hari bermain
-- ============================================================
CREATE TABLE sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  total_courts   INTEGER NOT NULL CHECK (total_courts >= 1),
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  match_duration INTEGER NOT NULL DEFAULT 15, -- menit per match
  total_rounds   INTEGER,                     -- dihitung otomatis saat start
  current_round  INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'active', 'finished')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSION CONFIG
-- Konfigurasi matchmaking per sesi (bisa di-override admin)
-- ============================================================
CREATE TABLE session_config (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id             UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  level_diff_max         INTEGER NOT NULL DEFAULT 2,
  partner_avoid_rounds   INTEGER NOT NULL DEFAULT 3,
  opponent_avoid_rounds  INTEGER NOT NULL DEFAULT 2,
  UNIQUE (session_id)
);

-- ============================================================
-- SESSION PLAYERS
-- Pemain yang hadir di sesi tertentu
-- ============================================================
CREATE TABLE session_players (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  joined_at_round     INTEGER NOT NULL DEFAULT 1,  -- telat masuk → isi round mulai main
  left_at_round       INTEGER,                      -- NULL = main sampai selesai
  last_played_round   INTEGER NOT NULL DEFAULT 0,  -- 0 = belum pernah main di sesi ini
  rounds_sat_out      INTEGER NOT NULL DEFAULT 0,
  total_matches       INTEGER NOT NULL DEFAULT 0,
  total_wins          INTEGER NOT NULL DEFAULT 0,
  UNIQUE (session_id, player_id)
);

-- ============================================================
-- MATCHES
-- Setiap pertandingan di setiap round & court
-- ============================================================
CREATE TABLE matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number     INTEGER NOT NULL,
  court_number     INTEGER NOT NULL,
  -- Tim A
  team_a_player1   UUID NOT NULL REFERENCES players(id),
  team_a_player2   UUID NOT NULL REFERENCES players(id),
  -- Tim B
  team_b_player1   UUID NOT NULL REFERENCES players(id),
  team_b_player2   UUID NOT NULL REFERENCES players(id),
  -- Skor
  score_a          INTEGER CHECK (score_a >= 0),
  score_b          INTEGER CHECK (score_b >= 0),
  -- Status
  winner           TEXT CHECK (winner IN ('team_a', 'team_b', 'draw')),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'ongoing', 'finished')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, round_number, court_number)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_session_players_session ON session_players(session_id);
CREATE INDEX idx_session_players_player  ON session_players(player_id);
CREATE INDEX idx_matches_session         ON matches(session_id);
CREATE INDEX idx_matches_session_round   ON matches(session_id, round_number);
CREATE INDEX idx_sessions_date           ON sessions(date);

-- ============================================================
-- REALTIME
-- Aktifkan untuk live match board
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches         ENABLE ROW LEVEL SECURITY;

-- SELECT: siapapun bisa baca (untuk live board publik)
CREATE POLICY "public read players"         ON players         FOR SELECT USING (true);
CREATE POLICY "public read sessions"        ON sessions        FOR SELECT USING (true);
CREATE POLICY "public read session_config"  ON session_config  FOR SELECT USING (true);
CREATE POLICY "public read session_players" ON session_players FOR SELECT USING (true);
CREATE POLICY "public read matches"         ON matches         FOR SELECT USING (true);

-- INSERT / UPDATE / DELETE: hanya authenticated user (admin)
CREATE POLICY "admin insert players"         ON players         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin update players"         ON players         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin delete players"         ON players         FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "admin insert sessions"        ON sessions        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin update sessions"        ON sessions        FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin delete sessions"        ON sessions        FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "admin insert session_config"  ON session_config  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin update session_config"  ON session_config  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "admin insert session_players" ON session_players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin update session_players" ON session_players FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin delete session_players" ON session_players FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "admin insert matches"         ON matches         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin update matches"         ON matches         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin delete matches"         ON matches         FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Session Leaderboard (per sesi)
CREATE OR REPLACE VIEW session_leaderboard AS
SELECT
  sp.session_id,
  p.id          AS player_id,
  p.name,
  p.level,
  sp.total_matches,
  sp.total_wins,
  (sp.total_matches - sp.total_wins) AS total_losses,
  -- Poin: Menang = 3, Kalah = 1
  (sp.total_wins * 3) + ((sp.total_matches - sp.total_wins) * 1) AS points
FROM session_players sp
JOIN players p ON p.id = sp.player_id
ORDER BY points DESC, sp.total_wins DESC, sp.total_matches DESC;

-- View: Monthly Ranking
CREATE OR REPLACE VIEW monthly_ranking AS
SELECT
  DATE_TRUNC('month', s.date)   AS month,
  p.id                          AS player_id,
  p.name,
  p.level,
  COUNT(DISTINCT s.id)          AS sessions_played,
  SUM(sp.total_matches)         AS total_matches,
  SUM(sp.total_wins)            AS total_wins,
  SUM(sp.total_matches - sp.total_wins) AS total_losses,
  -- Poin: Menang = 3, Kalah = 1
  SUM((sp.total_wins * 3) + ((sp.total_matches - sp.total_wins) * 1)) AS points
FROM session_players sp
JOIN sessions s  ON s.id = sp.session_id
JOIN players  p  ON p.id = sp.player_id
WHERE s.status = 'finished'
GROUP BY DATE_TRUNC('month', s.date), p.id, p.name, p.level
ORDER BY month DESC, points DESC;

-- ============================================================
-- FUNCTION: Update session_players stats after match scored
-- Dipanggil dari Server Action setelah admin input skor
-- ============================================================
CREATE OR REPLACE FUNCTION update_match_stats(
  p_match_id UUID,
  p_score_a  INTEGER,
  p_score_b  INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_match    matches%ROWTYPE;
  v_winner   TEXT;
  v_session  UUID;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  v_session := v_match.session_id;

  -- Tentukan pemenang
  IF p_score_a > p_score_b THEN
    v_winner := 'team_a';
  ELSIF p_score_b > p_score_a THEN
    v_winner := 'team_b';
  ELSE
    v_winner := 'draw';
  END IF;

  -- Update match
  UPDATE matches SET
    score_a = p_score_a,
    score_b = p_score_b,
    winner  = v_winner,
    status  = 'finished'
  WHERE id = p_match_id;

  -- Update total_matches untuk semua 4 pemain
  UPDATE session_players SET
    total_matches = total_matches + 1
  WHERE session_id = v_session
    AND player_id IN (
      v_match.team_a_player1, v_match.team_a_player2,
      v_match.team_b_player1, v_match.team_b_player2
    );

  -- Update total_wins untuk pemenang
  IF v_winner = 'team_a' THEN
    UPDATE session_players SET total_wins = total_wins + 1
    WHERE session_id = v_session
      AND player_id IN (v_match.team_a_player1, v_match.team_a_player2);
  ELSIF v_winner = 'team_b' THEN
    UPDATE session_players SET total_wins = total_wins + 1
    WHERE session_id = v_session
      AND player_id IN (v_match.team_b_player1, v_match.team_b_player2);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Calculate total rounds from session params
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_total_rounds(
  p_start_time     TIME,
  p_end_time       TIME,
  p_match_duration INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  total_minutes INTEGER;
BEGIN
  total_minutes := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60;
  RETURN FLOOR(total_minutes / p_match_duration);
END;
$$ LANGUAGE plpgsql;
