# Badminton Session Manager — Project Brief

## Overview
Web app untuk mengatur sesi permainan badminton komunitas secara otomatis, adil, dan kompetitif.
Admin mengelola pemain, lapangan, matchmaking, input skor, dan ranking bulanan.

---

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database & Auth**: Supabase (PostgreSQL, Realtime, RLS)
- **Styling**: Tailwind CSS
- **State Management**: React Server Components + Server Actions (minimal client state)
- **Deployment**: Vercel

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # hanya untuk Server Actions
```

---

## Project Structure
```
/app
  /dashboard          # halaman utama admin
  /players            # manajemen pemain
  /session
    /new              # start session baru
    /[id]             # live session (match board + input skor)
    /[id]/result      # hasil akhir sesi
  /ranking            # monthly ranking
/components
  /ui                 # komponen generik
  /session            # komponen spesifik session
  /match              # komponen match board
/lib
  /supabase           # client & server supabase instance
  /matchmaking        # SEMUA logic matchmaking (server-only)
  /scoring            # kalkulasi poin & ranking
/types                # TypeScript types dari database schema
```

---

## Business Rules

### Sistem Poin
```
Menang  → +3 poin
Kalah   → +1 poin  (tetap dihargai karena hadir & bermain)
Tidak main di round tertentu → 0 poin
```

### Matchmaking Constraints
```
level_diff_max         = 2    # selisih level max antar 4 pemain
partner_avoid_rounds   = 3    # hindari partner yang sama dalam 3 round terakhir
opponent_avoid_rounds  = 2    # hindari lawan yang sama dalam 2 round terakhir
```

### Relaxation Tier (jika tidak ada kombinasi valid)
```
Tier 1: level_diff ≤ 2, hindari partner 3 round, hindari lawan 2 round
Tier 2: level_diff ≤ 3, hindari partner 2 round, hindari lawan 1 round
Tier 3: level_diff ≤ 4, hindari partner 1 round, tidak ada constraint lawan
Tier 4: best effort — tidak ada constraint histori, level_diff ≤ 5
```
Sistem coba dari Tier 1. Jika gagal, naik ke Tier 2, dst.

### Tim Balancing (dalam 4 pemain terpilih)
```
Urutkan 4 pemain: P1 (tertinggi) → P2 → P3 → P4 (terendah)
Tim A: P1 + P4
Tim B: P2 + P3
→ Total level kedua tim selalu seimbang
```

### Rotasi Pemain (Sitting Out)
```
Jika jumlah pemain aktif > court × 4:
  → Pemain dengan last_played_round paling kecil = prioritas main
  → Pemain yang sitting out paling lama = main duluan di round berikutnya
Jika jumlah pemain aktif < court × 4:
  → Kurangi jumlah court aktif round itu
  → Tidak pernah membuat match dengan < 4 pemain
```

### Pemain Terlambat / Pulang Awal
```
joined_at_round  → pemain tidak diikutsertakan sebelum round ini
left_at_round    → pemain tidak diikutsertakan mulai round ini
```

---

## Matchmaking Algorithm (Server Action)

```typescript
// Pseudocode — implementasi di /lib/matchmaking/generateRound.ts

function generateRound(sessionId, roundNumber, tier = 1):
  1. Ambil pemain aktif sesi (joined_at_round <= roundNumber, left_at_round > roundNumber atau null)
  2. Urutkan berdasarkan last_played_round ASC, lalu level ASC (yang lama tidak main = prioritas)
  3. Ambil pemain sejumlah court × 4 (sisanya = sitting_out round ini)
  4. Untuk setiap court, coba bentuk grup 4 pemain dengan:
     - max(level) - min(level) <= level_diff_max[tier]
     - Tidak ada 2 pemain yang jadi partner dalam partner_avoid_rounds[tier] terakhir
     - Tidak ada 2 pemain yang jadi lawan dalam opponent_avoid_rounds[tier] terakhir
  5. Jika tidak ada kombinasi valid → generateRound(sessionId, roundNumber, tier + 1)
  6. Jika tier > 4 → gunakan best effort (abaikan semua constraint histori)
  7. Simpan hasil ke tabel matches
  8. Update last_played_round di session_players
```

**PENTING**: Seluruh fungsi matchmaking harus di server (`'use server'`). Tidak boleh ada logic matchmaking di client component.

---

## Database Schema
Lihat file `schema.sql` untuk definisi lengkap tabel, indexes, dan RLS policies.

### Ringkasan Tabel
- `players` — master data pemain komunitas
- `sessions` — sesi bermain (per hari)
- `session_config` — konfigurasi matchmaking per sesi (bisa di-override admin)
- `session_players` — pemain yang hadir di sesi tertentu + tracking statistik
- `matches` — hasil setiap pertandingan per round

---

## Supabase Setup Notes

### Realtime
Aktifkan Realtime pada tabel `matches` untuk Live Match Board:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
```

### Anti-pause (Free Tier)
Setup cron job eksternal (cron-job.org) untuk ping Supabase setiap 5 hari:
```
URL: https://<project>.supabase.co/rest/v1/players?select=id&limit=1
Header: apikey: <anon_key>
```

### RLS Policies
- Semua tabel: `select` → public (boleh dibaca siapapun untuk live board)
- `insert/update/delete` → hanya authenticated user (admin)
- Gunakan `SUPABASE_SERVICE_ROLE_KEY` hanya di Server Actions

---

## Key Invariants (Jangan Dilanggar)

1. **Matchmaking SELALU di server** — jangan pindahkan ke client
2. **Session state di database** — `current_round` dan `status` selalu up-to-date di tabel `sessions`
3. **Tidak ada match dengan < 4 pemain** — kurangi court jika pemain tidak cukup
4. **Poin dihitung dari tabel `matches`** — jangan simpan poin di tempat lain (computed dari data)
5. **Monthly ranking = agregasi otomatis** — tidak ada tabel ranking terpisah, selalu query live

---

## Monthly Ranking Query Logic
```sql
-- Ranking bulanan dihitung on-the-fly dari matches + session_players
-- Filter: sessions.date >= awal bulan AND sessions.date <= akhir bulan
-- Agregasi per player: SUM(poin), COUNT(matches), COUNT(wins)
-- Poin: win = 3, loss = 1, tidak main = 0
```

---

## UI/UX Notes
- Mobile-first (admin pakai HP di lapangan)
- Live Match Board harus bisa dibaca dari jarak 1–2 meter
- Font besar untuk nama pemain dan skor di board
- Warna Tim A vs Tim B jelas berbeda
- Tombol "Input Skor" prominent, tidak perlu scroll

---

## MVP Scope (v1)
- [x] Player management (CRUD)
- [x] Start session (pilih pemain, lapangan, durasi)
- [x] Generate round otomatis (matchmaking)
- [x] Live match board
- [x] Input skor
- [x] Session leaderboard
- [x] Monthly ranking

## Out of Scope (v1)
- Export PDF
- ELO rating
- Mode turnamen
- Statistik histori detail per pemain
- Multi-komunitas / multi-admin
