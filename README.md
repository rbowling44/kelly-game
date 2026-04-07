# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## The Masters (Golf Mode) — Integration Notes

This project includes a new "Golf Mode" (The Masters Kelly Game) that runs alongside the existing NCAA Kelly Game. Key files added:

- `supabase/migrations/001_create_golf_tables.sql` — creates `golf_tournaments`, `golf_golfers`, `golf_odds`, `golf_wagers`, `golf_bankrolls` and triggers.
- `supabase/migrations/002_golf_rpcs.sql` — RPCs for placing wagers and settling rounds: `golf_place_wager`, `golf_settle_round`.
- `src/lib/datagolf.js` — Data Golf API helper for outrights and leaderboard.
- `src/lib/supabaseGolf.js` — Supabase helpers and RPC wrappers for golf flows.
- `src/contexts/GolfModeContext.jsx` — React context to toggle between modes.
- Admin components: `src/components/admin/GolfModeToggle.jsx`, `OddsManager.jsx`, `SettleRound.jsx`, `LeaderboardSync.jsx`.
- Player pages: `src/components/golf/Picks.jsx`, `Leaderboard.jsx`, `WagerLog.jsx`, `History.jsx`, `Rules.jsx`.

Environment
- Add your Data Golf API key to `.env` in the project root as `VITE_DATAGOLF_API_KEY`. See `.env.example`.

Database migration & setup
1. Apply the migrations to your Supabase/Postgres instance (or run SQL via Supabase SQL editor) in order:

```bash
# from project root — run SQL files against your DB
psql "$SUPABASE_DB_URL" -f supabase/migrations/001_create_golf_tables.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/002_golf_rpcs.sql
```

2. Optionally create a Masters tournament row in `golf_tournaments`:

```sql
INSERT INTO golf_tournaments (name, year, status, active_kelly_round, mode) VALUES ('The Masters', 2026, 'upcoming', 1, 'masters');
```

Frontend integration
- The app now wraps the UI in a `GolfModeProvider`. Admins can toggle mode in the Admin panel. When `app_mode` setting is set to `golf` (via `GolfModeToggle`), the UI switches branding and pages to Golf Mode.

How Data Golf integration works
- R1 odds: `OddsManager` calls Data Golf outrights endpoints and upserts golfers & odds.
- Live leaderboard: `LeaderboardSync` pulls the Data Golf `field-updates` feed and updates `golf_golfers.made_cut` and `final_position`.
- Settle: Admin hits `Settle Round` to run `golf_settle_round` RPC which calculates wins/losses, updates `golf_wagers`, and seeds next-round `golf_bankrolls` with winnings.

Notes & next tasks
- The UI scaffolds are added for admin and player flows but need polish and additional validations (e.g., locking windows, exact odds parsing, tournament selection UI).
- Default `tournament_id` is currently `1` in admin components; consider adding tournament management UI to create/select tournaments.
- Test the RPCs on a staging DB before production.

Commands
```bash
# install deps
npm install

# dev
npm run dev

# build
npm run build
```

Contact
If you want, I can: run the migrations against a supplied Supabase instance, wire tournament selection UI, or add unit tests — tell me which next.
