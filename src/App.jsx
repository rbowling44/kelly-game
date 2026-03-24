import { useState, useEffect, useCallback } from "react";

// ============================================================
// DESIGN: The Kelly Game — deep forest greens, crisp white
// typography, Kelly green accents, classic championship feel.
// ============================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --court: #0a1a0e;
    --hardwood: #0f2415;
    --grain: #163320;
    --chalk: #f0f8f0;
    --chalk-dim: #8aaa8e;
    --orange: #4dbd5c;
    --orange-dim: #3a9e49;
    --green: #80e88f;
    --red: #e74c3c;
    --gold: #f0e040;
    --kelly: #4dbd5c;
    --line: rgba(77,189,92,0.15);
  }

  body { background: var(--court); color: var(--chalk); font-family: 'Barlow Condensed', sans-serif; min-height: 100vh; }

  .app { min-height: 100vh; background: var(--court);
    background-image: repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(77,189,92,0.03) 80px, rgba(77,189,92,0.03) 81px),
    repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(77,189,92,0.03) 80px, rgba(77,189,92,0.03) 81px); }

  /* ---- HEADER ---- */
  .header { background: var(--hardwood); border-bottom: 2px solid var(--kelly); padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
    position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 24px rgba(0,0,0,0.6); }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; color: var(--kelly);
    text-shadow: 0 0 24px rgba(77,189,92,0.5); }
  .logo span { color: var(--chalk); }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .header-user { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--chalk-dim); }
  .header-points { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--gold);
    background: rgba(240,192,64,0.1); border: 1px solid rgba(240,192,64,0.3); padding: 4px 12px; }
  .btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 1px;
    padding: 8px 20px; border: none; cursor: pointer; transition: all 0.15s; text-transform: uppercase; }
  .btn-orange { background: var(--kelly); color: #0a1a0e; }
  .btn-orange:hover { background: var(--orange-dim); transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--chalk-dim); border: 1px solid var(--line); }
  .btn-ghost:hover { border-color: var(--chalk-dim); color: var(--chalk); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-green { background: var(--green); color: var(--court); }
  .btn-green:hover { background: #27ae60; }
  .btn-red { background: var(--red); color: #fff; }

  /* ---- NAV TABS ---- */
  .nav { display: flex; gap: 2px; padding: 16px 24px 0; border-bottom: 1px solid var(--line); }
  .nav-tab { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 2px; padding: 8px 20px;
    cursor: pointer; color: var(--chalk-dim); border-bottom: 3px solid transparent; transition: all 0.15s; background: none; border-top: none; border-left: none; border-right: none; }
  .nav-tab:hover { color: var(--chalk); }
  .nav-tab.active { color: var(--kelly); border-bottom-color: var(--kelly); }

  /* ---- MAIN ---- */
  .main { padding: 24px; max-width: 1100px; margin: 0 auto; }

  /* ---- AUTH ---- */
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-card { background: var(--hardwood); border: 1px solid var(--line); padding: 48px; width: 100%; max-width: 440px;
    position: relative; }
  .auth-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--kelly); }
  .auth-title { font-family: 'Bebas Neue', sans-serif; font-size: 48px; letter-spacing: 4px; color: var(--kelly); text-align: center; }
  .auth-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--chalk-dim); text-align: center; letter-spacing: 2px; margin-bottom: 40px; }
  .field { margin-bottom: 20px; }
  .field label { display: block; font-size: 11px; letter-spacing: 2px; color: var(--chalk-dim); margin-bottom: 6px; font-family: 'DM Mono', monospace; }
  .field input, .field select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--line);
    color: var(--chalk); padding: 12px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 16px; outline: none;
    transition: border-color 0.15s; }
  .field input:focus, .field select:focus { border-color: var(--kelly); }
  .field select option { background: var(--hardwood); }
  .auth-switch { margin-top: 20px; text-align: center; font-size: 13px; color: var(--chalk-dim); }
  .auth-switch button { background: none; border: none; color: var(--kelly); cursor: pointer; font-family: inherit; font-size: 13px; text-decoration: underline; }
  .error-msg { background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.4); color: #ff8070; padding: 10px 16px; font-size: 13px; margin-bottom: 16px; font-family: 'DM Mono', monospace; }
  .success-msg { background: rgba(46,204,113,0.15); border: 1px solid rgba(46,204,113,0.4); color: var(--green); padding: 10px 16px; font-size: 13px; margin-bottom: 16px; font-family: 'DM Mono', monospace; }

  /* ---- ROUND BADGE ---- */
  .round-banner { background: var(--hardwood); border: 1px solid var(--line); padding: 20px 24px; margin-bottom: 24px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: gap; gap: 12px; }
  .round-name { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 3px; color: var(--kelly); }
  .round-dates { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--chalk-dim); }
  .round-status { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1px; }
  .status-open { color: var(--kelly); }
  .status-locked { color: var(--red); }
  .status-complete { color: var(--chalk-dim); }
  .bank-warning { background: rgba(77,189,92,0.08); border: 1px solid rgba(77,189,92,0.3); padding: 10px 16px;
    font-family: 'DM Mono', monospace; font-size: 11px; color: var(--kelly); margin-bottom: 16px; }

  /* ---- GAMES GRID ---- */
  .games-grid { display: flex; flex-direction: column; gap: 12px; }
  .game-card { background: var(--hardwood); border: 1px solid var(--line); transition: border-color 0.15s; }
  .game-card:hover { border-color: rgba(245,240,232,0.2); }
  .game-header { padding: 10px 16px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
  .game-region { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 2px; }
  .game-time { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .game-body { padding: 16px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
  .team { display: flex; flex-direction: column; }
  .team-away { align-items: flex-start; }
  .team-home { align-items: flex-end; }
  .team-seed { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--orange); }
  .team-name { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; line-height: 1; }
  .team-record { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .spread-center { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .spread-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 1px; }
  .spread-val { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--gold); }
  .at-sign { font-family: 'DM Mono', monospace; font-size: 14px; color: var(--chalk-dim); }
  .pick-row { padding: 12px 16px; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .pick-btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 1px;
    padding: 8px 16px; border: 1px solid var(--line); background: transparent; color: var(--chalk-dim);
    cursor: pointer; transition: all 0.15s; text-transform: uppercase; flex: 1; min-width: 120px; text-align: center; }
  .pick-btn:hover { border-color: var(--kelly); color: var(--kelly); }
  .pick-btn.selected-away { border-color: var(--kelly); background: rgba(77,189,92,0.15); color: var(--kelly); }
  .pick-btn.selected-home { border-color: var(--kelly); background: rgba(77,189,92,0.15); color: var(--kelly); }
  .wager-input { background: rgba(255,255,255,0.05); border: 1px solid var(--line); color: var(--chalk);
    padding: 8px 12px; font-family: 'DM Mono', monospace; font-size: 14px; width: 90px; outline: none; }
  .wager-input:focus { border-color: var(--kelly); }
  .wager-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .pick-result { font-family: 'DM Mono', monospace; font-size: 11px; padding: 6px 12px; }
  .result-win { background: rgba(46,204,113,0.15); color: var(--green); border: 1px solid rgba(46,204,113,0.3); }
  .result-loss { background: rgba(231,76,60,0.15); color: var(--red); border: 1px solid rgba(231,76,60,0.3); }
  .result-push { background: rgba(240,192,64,0.15); color: var(--gold); border: 1px solid rgba(240,192,64,0.3); }
  .result-pending { background: rgba(255,255,255,0.05); color: var(--chalk-dim); border: 1px solid var(--line); }

  /* ---- SCORE DISPLAY ---- */
  .score-display { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: var(--chalk); }
  .score-final { color: var(--chalk-dim); font-size: 12px; font-family: 'DM Mono', monospace; }

  /* ---- SUMMARY BAR ---- */
  .summary-bar { background: var(--hardwood); border: 1px solid var(--line); padding: 16px 24px; margin-bottom: 24px;
    display: flex; gap: 32px; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; }
  .stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 36px; line-height: 1; }
  .stat-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 1px; }
  .stat-orange { color: var(--kelly); }
  .stat-green { color: var(--green); }
  .stat-gold { color: var(--gold); }
  .stat-red { color: var(--red); }

  /* ---- LEADERBOARD ---- */
  .leaderboard { background: var(--hardwood); border: 1px solid var(--line); }
  .lb-header { padding: 16px 24px; border-bottom: 1px solid var(--line); display: flex; align-items: baseline; gap: 12px; }
  .lb-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; color: var(--kelly); }
  .lb-round { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--chalk-dim); }
  .lb-row { display: grid; grid-template-columns: 48px 1fr repeat(4, 80px); padding: 12px 24px;
    border-bottom: 1px solid var(--line); align-items: center; transition: background 0.1s; }
  .lb-row:hover { background: rgba(255,255,255,0.03); }
  .lb-row.me { background: rgba(77,189,92,0.08); border-left: 3px solid var(--kelly); }
  .lb-row-header { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 1px;
    padding: 8px 24px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 48px 1fr repeat(4, 80px); }
  .lb-row-header-wide { grid-template-columns: 48px 1fr repeat(5, 72px) !important; }
  .lb-row-wide { grid-template-columns: 48px 1fr repeat(5, 72px) !important; }
  .lb-rank { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--chalk-dim); }
  .lb-rank.top1 { color: var(--gold); }
  .lb-rank.top2 { color: #aaa; }
  .lb-rank.top3 { color: #cd7f32; }
  .lb-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 18px; }
  .lb-val { font-family: 'DM Mono', monospace; font-size: 13px; text-align: right; }
  .lb-val.pts { color: var(--gold); font-size: 16px; font-weight: 500; }

  /* ---- HISTORY ---- */
  .history-round { margin-bottom: 24px; }
  .history-round-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--chalk-dim); padding: 12px 0; border-bottom: 1px solid var(--line); margin-bottom: 12px; }
  .history-pick { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
  .history-game { color: var(--chalk-dim); flex: 1; }
  .history-pick-team { color: var(--chalk); font-weight: 600; flex: 1; }
  .history-wager { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--chalk-dim); flex: 0 0 80px; text-align: right; }

  /* ---- ADMIN ---- */
  .admin-section { margin-bottom: 32px; }
  .admin-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; color: var(--kelly); margin-bottom: 16px; }
  .admin-game-row { background: var(--hardwood); border: 1px solid var(--line); padding: 16px; margin-bottom: 8px;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .admin-game-teams { flex: 1; font-size: 15px; font-weight: 600; }
  .admin-score-inputs { display: flex; gap: 8px; align-items: center; }
  .admin-score-inputs input { background: rgba(255,255,255,0.05); border: 1px solid var(--line); color: var(--chalk);
    padding: 6px 10px; font-family: 'DM Mono', monospace; font-size: 14px; width: 70px; outline: none; }
  .admin-score-inputs input:focus { border-color: var(--orange); }
  .admin-score-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .tag { font-family: 'DM Mono', monospace; font-size: 10px; padding: 3px 8px; letter-spacing: 1px; }
  .tag-open { background: rgba(46,204,113,0.15); color: var(--green); border: 1px solid rgba(46,204,113,0.3); }
  .tag-locked { background: rgba(231,76,60,0.15); color: var(--red); border: 1px solid rgba(231,76,60,0.3); }
  .tag-final { background: rgba(255,255,255,0.05); color: var(--chalk-dim); border: 1px solid var(--line); }

  .divider { height: 1px; background: var(--line); margin: 24px 0; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
  .modal { background: var(--hardwood); border: 1px solid var(--kelly); padding: 32px; width: 100%; max-width: 480px; position: relative; }
  .modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; color: var(--kelly); margin-bottom: 20px; }
  .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--chalk-dim); cursor: pointer; font-size: 20px; }

  .btn-full { width: 100%; margin-top: 8px; padding: 14px; font-size: 16px; }

  .empty-state { text-align: center; padding: 48px; color: var(--chalk-dim); font-family: 'DM Mono', monospace; font-size: 13px; }

  .api-note { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); background: rgba(255,255,255,0.03); border: 1px solid var(--line); padding: 8px 12px; margin-bottom: 16px; }
  .api-note a { color: var(--kelly); }

  @media (max-width: 600px) {
    .game-body { grid-template-columns: 1fr; }
    .lb-row, .lb-row-header { grid-template-columns: 36px 1fr repeat(2, 70px); }
    .lb-row > *:nth-child(4), .lb-row > *:nth-child(5), .lb-row-header > *:nth-child(4), .lb-row-header > *:nth-child(5) { display: none; }
    .summary-bar { gap: 16px; }
  }
`;

// ============================================================
// STORAGE (simulates a backend with localStorage)
// ============================================================
const DB = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  users: () => DB.get('ncaa_users') || {},
  saveUsers: (u) => DB.set('ncaa_users', u),
  games: () => DB.get('ncaa_games') || [],
  saveGames: (g) => DB.set('ncaa_games', g),
  picks: () => DB.get('ncaa_picks') || {},
  savePicks: (p) => DB.set('ncaa_picks', p),
  currentRound: () => DB.get('ncaa_round') ?? 1,
  saveRound: (r) => DB.set('ncaa_round', r),
  roundStatus: () => DB.get('ncaa_round_status') || {},
  saveRoundStatus: (s) => DB.set('ncaa_round_status', s),
  startingPoints: () => DB.get('ncaa_starting_pts') ?? 100,
  saveStartingPoints: (n) => DB.set('ncaa_starting_pts', n),
};

const ROUNDS = [
  { num: 1, name: "Round of 64", dates: "Thu–Fri, Mar 20–21" },
  { num: 2, name: "Round of 32", dates: "Sat–Sun, Mar 22–23" },
  { num: 3, name: "Sweet 16", dates: "Thu–Fri, Mar 27–28" },
  { num: 4, name: "Elite Eight", dates: "Sat–Sun, Mar 29–30" },
  { num: 5, name: "Final Four", dates: "Sat, Apr 5" },
  { num: 6, name: "Championship", dates: "Mon, Apr 7" },
];

const REGIONS = ["South", "East", "Midwest", "West"];

// Returns true if a game's picks should be locked
function isGameLocked(game) {
  if (game.lockedOverride === true) return true;
  if (game.lockedOverride === false) return false; // admin explicitly unlocked
  if (game.status === "final") return true;
  if (!game.tipoff) return false;
  return new Date() >= new Date(game.tipoff);
}

// Sample seeded games for demo
const SAMPLE_GAMES = [
  { id: "g1r1", round: 1, region: "South", awayTeam: "Auburn", awaySeed: 1, homeTeam: "Alabama St.", homeSeed: 16, spread: -28.5, status: "open", awayScore: null, homeScore: null, gameTime: "12:15 PM ET Thu", tipoff: "2026-03-19T12:15:00-04:00", lockedOverride: null },
  { id: "g2r1", round: 1, region: "South", awayTeam: "Michigan St.", awaySeed: 8, homeTeam: "Mississippi", homeSeed: 9, spread: -1.5, status: "open", awayScore: null, homeScore: null, gameTime: "2:45 PM ET Thu", tipoff: "2026-03-19T14:45:00-04:00", lockedOverride: null },
  { id: "g3r1", round: 1, region: "East", awayTeam: "Duke", awaySeed: 1, homeTeam: "Mount St. Mary's", homeSeed: 16, spread: -25.5, status: "open", awayScore: null, homeScore: null, gameTime: "7:10 PM ET Thu", tipoff: "2026-03-19T19:10:00-04:00", lockedOverride: null },
  { id: "g4r1", round: 1, region: "East", awayTeam: "Missouri", awaySeed: 8, homeTeam: "Drake", homeSeed: 9, spread: -2.5, status: "open", awayScore: null, homeScore: null, gameTime: "9:40 PM ET Thu", tipoff: "2026-03-19T21:40:00-04:00", lockedOverride: null },
  { id: "g5r1", round: 1, region: "Midwest", awayTeam: "Houston", awaySeed: 1, homeTeam: "SIU Edwardsville", homeSeed: 16, spread: -30.5, status: "open", awayScore: null, homeScore: null, gameTime: "12:15 PM ET Fri", tipoff: "2026-03-20T12:15:00-04:00", lockedOverride: null },
  { id: "g6r1", round: 1, region: "Midwest", awayTeam: "Gonzaga", awaySeed: 4, homeTeam: "Georgia", homeSeed: 13, spread: -8.5, status: "open", awayScore: null, homeScore: null, gameTime: "2:45 PM ET Fri", tipoff: "2026-03-20T14:45:00-04:00", lockedOverride: null },
  { id: "g7r1", round: 1, region: "West", awayTeam: "Florida", awaySeed: 1, homeTeam: "Norfolk St.", homeSeed: 16, spread: -27.5, status: "open", awayScore: null, homeScore: null, gameTime: "7:10 PM ET Fri", tipoff: "2026-03-20T19:10:00-04:00", lockedOverride: null },
  { id: "g8r1", round: 1, region: "West", awayTeam: "UConn", awaySeed: 2, homeTeam: "Oklahoma", homeSeed: 15, spread: -14.5, status: "open", awayScore: null, homeScore: null, gameTime: "9:40 PM ET Fri", tipoff: "2026-03-20T21:40:00-04:00", lockedOverride: null },
];

function initData() {
  if (!DB.get('ncaa_initialized_v2')) {
    const users = {};
    const adminPass = btoa("admin123");
    users["admin@tourney.com"] = { email: "admin@tourney.com", password: adminPass, name: "Commissioner", isAdmin: true, rounds: { 1: 100 }, history: [] };
    DB.saveUsers(users);
    DB.saveGames(SAMPLE_GAMES);
    DB.saveRound(1);
    DB.saveRoundStatus({ 1: "open" });
    DB.saveStartingPoints(100);
    DB.set('ncaa_initialized_v2', true);
  }
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("picks");
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
    initData();
    const saved = sessionStorage.getItem('ncaa_session');
    if (saved) setUser(JSON.parse(saved));
    return () => document.head.removeChild(style);
  }, []);

  const login = (u) => { setUser(u); sessionStorage.setItem('ncaa_session', JSON.stringify(u)); };
  const logout = () => { setUser(null); sessionStorage.removeItem('ncaa_session'); };

  if (!user) return <AuthScreen onLogin={login} />;

  const currentUser = DB.users()[user.email];
  const currentRound = DB.currentRound();

  return (
    <div className="app">
      <header className="header">
        <div className="logo">THE KELLY<span> GAME</span></div>
        <div className="header-right">
          <span className="header-user">{currentUser?.name}</span>
          {!currentUser?.isAdmin && (
            <span className="header-points">
              {getCurrentPoints(currentUser, currentRound)} PTS
            </span>
          )}
          {currentUser?.isAdmin && <span className="tag tag-open">ADMIN</span>}
          <button className="btn btn-ghost btn-sm" onClick={logout}>LOGOUT</button>
        </div>
      </header>

      <nav className="nav">
        {!currentUser?.isAdmin && <button className={`nav-tab ${tab==='picks'?'active':''}`} onClick={()=>setTab('picks')}>MY PICKS</button>}
        <button className={`nav-tab ${tab==='board'?'active':''}`} onClick={()=>setTab('board')}>LEADERBOARD</button>
        {!currentUser?.isAdmin && <button className={`nav-tab ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}>HISTORY</button>}
        {currentUser?.isAdmin && <button className={`nav-tab ${tab==='admin'?'active':''}`} onClick={()=>setTab('admin')}>ADMIN</button>}
      </nav>

      <main className="main">
        {tab === 'picks' && !currentUser?.isAdmin && <PicksView user={currentUser} onRefresh={refresh} />}
        {tab === 'board' && <LeaderboardView currentEmail={user.email} />}
        {tab === 'history' && !currentUser?.isAdmin && <HistoryView user={currentUser} />}
        {tab === 'admin' && currentUser?.isAdmin && <AdminView onRefresh={refresh} />}
      </main>
    </div>
  );
}

function getCurrentPoints(user, round) {
  if (!user) return 0;
  return user.rounds?.[round] ?? 0;
}

// ============================================================
// AUTH
// ============================================================
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!email || !password) return setError("Email and password required.");
    const users = DB.users();

    if (mode === "login") {
      const u = users[email.toLowerCase()];
      if (!u || u.password !== btoa(password)) return setError("Invalid credentials.");
      onLogin(u);
    } else {
      if (!name) return setError("Name required.");
      if (users[email.toLowerCase()]) return setError("Email already registered.");
      const currentRound = DB.currentRound();
      const sp = DB.startingPoints();
      const newUser = { email: email.toLowerCase(), password: btoa(password), name, isAdmin: false, rounds: { [currentRound]: sp }, history: [] };
      users[email.toLowerCase()] = newUser;
      DB.saveUsers(users);
      onLogin(newUser);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">THE KELLY GAME</div>
        <div className="auth-sub">NCAA TOURNAMENT · SPREAD GAME</div>
        {error && <div className="error-msg">{error}</div>}
        {mode === "register" && (
          <div className="field">
            <label>YOUR NAME</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. John Smith" onKeyDown={e=>e.key==='Enter'&&submit()} />
          </div>
        )}
        <div className="field">
          <label>EMAIL</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==='Enter'&&submit()} />
        </div>
        <div className="field">
          <label>PASSWORD</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()} />
        </div>
        <button className="btn btn-orange btn-full" onClick={submit}>
          {mode === "login" ? "SIGN IN" : "JOIN THE GAME"}
        </button>
        <div className="auth-switch">
          {mode === "login" ? (
            <>New player? <button onClick={()=>setMode("register")}>Create account</button></>
          ) : (
            <>Already playing? <button onClick={()=>setMode("login")}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PICKS VIEW
// ============================================================
function PicksView({ user, onRefresh }) {
  const currentRound = DB.currentRound();
  const roundStatuses = DB.roundStatus();
  const roundStatus = roundStatuses[currentRound] || "open";
  const games = DB.games().filter(g => g.round === currentRound);
  const allPicks = DB.picks();
  const myPicks = allPicks[user.email] || {};
  const startingPoints = user.rounds?.[currentRound] ?? 0;

  const totalWagered = Object.values(myPicks)
    .filter(p => p.round === currentRound)
    .reduce((s, p) => s + (p.wager || 0), 0);

  const minRequired = Math.ceil(startingPoints * 0.5);
  const roundLocked = roundStatus === "locked" || roundStatus === "complete";

  const savePick = (gameId, side, wager) => {
    const allP = DB.picks();
    if (!allP[user.email]) allP[user.email] = {};
    allP[user.email][gameId] = { round: currentRound, side, wager: parseInt(wager) || 0 };
    DB.savePicks(allP);
    onRefresh();
  };

  const clearPick = (gameId) => {
    const allP = DB.picks();
    if (allP[user.email]) delete allP[user.email][gameId];
    DB.savePicks(allP);
    onRefresh();
  };

  const roundInfo = ROUNDS[currentRound - 1];

  return (
    <div>
      <div className="round-banner">
        <div>
          <div className="round-name">{roundInfo?.name || `Round ${currentRound}`}</div>
          <div className="round-dates">{roundInfo?.dates}</div>
        </div>
        <div>
          <div className={`round-status status-${roundStatus}`}>
            {roundStatus === "open" ? "● PICKS OPEN" : roundStatus === "locked" ? "■ PICKS LOCKED" : "✓ COMPLETE"}
          </div>
        </div>
      </div>

      <div className="summary-bar">
        <div className="stat"><span className="stat-val stat-gold">{startingPoints}</span><span className="stat-label">STARTING PTS</span></div>
        <div className="stat"><span className="stat-val stat-orange">{totalWagered}</span><span className="stat-label">WAGERED</span></div>
        <div className="stat"><span className={`stat-val ${startingPoints - totalWagered >= 0 ? 'stat-green' : 'stat-red'}`}>{startingPoints - totalWagered}</span><span className="stat-label">REMAINING</span></div>
        <div className="stat"><span className={`stat-val ${totalWagered >= minRequired ? 'stat-green' : 'stat-red'}`}>{minRequired}</span><span className="stat-label">MIN REQUIRED (50%)</span></div>
      </div>

      {!roundLocked && totalWagered < minRequired && (
        <div className="bank-warning">⚠ You must wager at least {minRequired} points this round. Currently at {totalWagered}.</div>
      )}

      <div className="games-grid">
        {games.length === 0 && <div className="empty-state">No games scheduled for this round yet.</div>}
        {games.map(game => (
          <GameCard
            key={game.id}
            game={game}
            myPick={myPicks[game.id]}
            locked={roundLocked || isGameLocked(game)}
            gameLocked={isGameLocked(game)}
            startingPoints={startingPoints}
            totalWagered={totalWagered}
            onPick={savePick}
            onClear={clearPick}
          />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game, myPick, locked, gameLocked, startingPoints, totalWagered, onPick, onClear }) {
  const [localSide, setLocalSide] = useState(myPick?.side || null);
  const [localWager, setLocalWager] = useState(myPick?.wager?.toString() || "");

  useEffect(() => {
    setLocalSide(myPick?.side || null);
    setLocalWager(myPick?.wager?.toString() || "");
  }, [myPick]);

  const selectSide = (side) => {
    if (locked) return;
    setLocalSide(side);
  };

  // Points already committed to OTHER games this round (not this game)
  const otherWagered = totalWagered - (myPick?.wager || 0);
  const availablePoints = startingPoints - otherWagered;

  const commitPick = () => {
    if (!localSide || !localWager || parseInt(localWager) <= 0) return;
    const wager = parseInt(localWager);
    if (wager > availablePoints) {
      alert(`You only have ${availablePoints} points available to wager on this game.`);
      return;
    }
    if (wager < 1) return;
    onPick(game.id, localSide, localWager);
  };

  const handleWagerChange = (e) => {
    const val = e.target.value;
    if (parseInt(val) > availablePoints) {
      setLocalWager(availablePoints.toString());
    } else {
      setLocalWager(val);
    }
  };

  const spreadDisplay = game.spread > 0 ? `+${game.spread}` : `${game.spread}`;
  const isAway = game.spread < 0;
  const favoriteLabel = isAway ? `${game.awayTeam} ${game.spread}` : `${game.homeTeam} ${game.spread}`;
  const underdogLabel = isAway ? `${game.homeTeam} +${Math.abs(game.spread)}` : `${game.awayTeam} +${Math.abs(game.spread)}`;

  let resultEl = null;
  if (myPick && game.status === "final") {
    const { won, push } = calcResult(game, myPick.side);
    if (push) resultEl = <span className="pick-result result-push">PUSH — {myPick.wager} pts returned</span>;
    else if (won) resultEl = <span className="pick-result result-win">WIN +{myPick.wager} pts</span>;
    else resultEl = <span className="pick-result result-loss">LOSS -{myPick.wager} pts</span>;
  } else if (myPick && game.status !== "final") {
    resultEl = <span className="pick-result result-pending">PENDING · {myPick.wager} pts</span>;
  }

  return (
    <div className="game-card">
      <div className="game-header">
        <span className="game-region">{game.region?.toUpperCase()} REGION</span>
        <span className="game-time">{game.gameTime}</span>
      </div>
      <div className="game-body">
        <div className="team team-away">
          <span className="team-seed">#{game.awaySeed}</span>
          <span className="team-name">{game.awayTeam}</span>
          {game.status === "final" && <span className="score-display">{game.awayScore}</span>}
        </div>
        <div className="spread-center">
          <span className="spread-label">SPREAD</span>
          <span className="spread-val">{spreadDisplay}</span>
          <span className="at-sign">@</span>
          {game.status === "final" && <span className="score-final">FINAL</span>}
        </div>
        <div className="team team-home">
          <span className="team-seed">#{game.homeSeed}</span>
          <span className="team-name">{game.homeTeam}</span>
          {game.status === "final" && <span className="score-display">{game.homeScore}</span>}
        </div>
      </div>

      <div className="pick-row">
        {!locked ? (
          <>
            <button
              className={`pick-btn ${localSide==='away'?'selected-away':''}`}
              onClick={() => selectSide('away')}>
              {isAway ? `${game.awayTeam} ${game.spread}` : `${game.awayTeam} +${Math.abs(game.spread)}`}
            </button>
            <button
              className={`pick-btn ${localSide==='home'?'selected-home':''}`}
              onClick={() => selectSide('home')}>
              {!isAway ? `${game.homeTeam} ${game.spread}` : `${game.homeTeam} +${Math.abs(game.spread)}`}
            </button>
            {localSide && (
              <>
                <div>
                  <div className="wager-label">WAGER <span style={{color:'var(--chalk-dim)'}}>/ {availablePoints} avail</span></div>
                  <input className="wager-input" type="number" min="1" max={availablePoints} value={localWager}
                    onChange={handleWagerChange} placeholder="pts" />
                </div>
                {myPick ? (
                  <button className="btn btn-sm" style={{background:'var(--red)',color:'#fff',cursor:'default',opacity:0.9}}>
                    LOCKED IN ✓
                  </button>
                ) : (
                  <button className="btn btn-orange btn-sm" onClick={commitPick}>LOCK IN</button>
                )}
                {myPick && <button className="btn btn-ghost btn-sm" onClick={()=>{ onClear(game.id); setLocalSide(null); setLocalWager(''); }}>CLEAR</button>}
              </>
            )}
          </>
        ) : (
          <>
            {gameLocked && game.status !== "final" && (
              <span style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--red)', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)', padding:'5px 12px', letterSpacing:1}}>
                🔒 GAME IN PROGRESS — PICKS CLOSED
              </span>
            )}
            {myPick ? (
              <span style={{fontSize:14,color:'var(--chalk)'}}>
                Picked: <strong>{myPick.side === 'away' ? game.awayTeam : game.homeTeam}</strong> for <strong>{myPick.wager} pts</strong>
              </span>
            ) : (
              !gameLocked && <span style={{fontSize:13,color:'var(--chalk-dim)',fontFamily:'DM Mono,monospace'}}>No pick submitted</span>
            )}
            {resultEl}
          </>
        )}
      </div>
    </div>
  );
}

function calcResult(game, side) {
  if (game.awayScore === null || game.homeScore === null) return { won: false, push: false };
  const diff = game.awayScore - game.homeScore; // positive = away wins outright
  const adjustedDiff = diff + game.spread; // if spread is -7 (away fav), away must win by 7+
  // side='away': bet on away team covering (diff > -spread)
  // side='home': bet on home team covering
  if (side === 'away') {
    const awayCovers = game.spread < 0 ? diff > Math.abs(game.spread) : diff > -game.spread;
    // simpler: away team covers if awayScore + spread > homeScore
    const awayFinal = game.awayScore + game.spread;
    if (awayFinal === game.homeScore) return { won: false, push: true };
    return { won: awayFinal > game.homeScore, push: false };
  } else {
    const awayFinal = game.awayScore + game.spread;
    if (awayFinal === game.homeScore) return { won: false, push: true };
    return { won: awayFinal < game.homeScore, push: false };
  }
}

// ============================================================
// LEADERBOARD
// ============================================================
function LeaderboardView({ currentEmail }) {
  const users = DB.users();
  const picks = DB.picks();
  const games = DB.games();
  const currentRound = DB.currentRound();

  const rows = Object.values(users)
    .filter(u => !u.isAdmin)
    .map(u => {
      const myPicks = picks[u.email] || {};
      // Current points = starting pts for this round + wins/losses from final games this round
      let totalPoints = u.rounds?.[currentRound] ?? 100;
      let totalWins = 0, totalLosses = 0, totalPushes = 0;
      let totalWagered = 0, totalPickCount = 0;

      // Loop ALL picks across ALL rounds for cumulative stats
      Object.entries(myPicks).forEach(([gid, pick]) => {
        const game = games.find(g => g.id === gid);
        if (!game) return;

        totalPickCount++;
        totalWagered += pick.wager || 0;

        if (game.status === "final") {
          const { won, push } = calcResult(game, pick.side);
          if (push) totalPushes++;
          else if (won) {
            totalWins++;
            // Only add to points if it's the current round (prior rounds already baked in)
            if (pick.round === currentRound) totalPoints += pick.wager;
          } else {
            totalLosses++;
            if (pick.round === currentRound) totalPoints -= pick.wager;
          }
        }
      });

      const avgWager = totalPickCount > 0 ? Math.round(totalWagered / totalPickCount) : 0;

      return { ...u, totalPoints, totalWins, totalLosses, totalPushes, avgWager, totalPickCount };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div>
      <div className="round-banner">
        <div className="round-name">LEADERBOARD</div>
        <div className="round-dates">{ROUNDS[currentRound-1]?.name}</div>
      </div>
      <div className="leaderboard">
        <div className="lb-header">
          <span className="lb-title">STANDINGS</span>
          <span className="lb-round">Round {currentRound} · Cumulative Stats</span>
        </div>
        <div className="lb-row-header lb-row-header-wide">
          <span>#</span>
          <span>PLAYER</span>
          <span style={{textAlign:'right'}}>POINTS</span>
          <span style={{textAlign:'right'}}>W</span>
          <span style={{textAlign:'right'}}>L</span>
          <span style={{textAlign:'right'}}>PUSH</span>
          <span style={{textAlign:'right'}}>AVG BET</span>
        </div>
        {rows.length === 0 && <div className="empty-state">No players yet.</div>}
        {rows.map((row, i) => (
          <div key={row.email} className={`lb-row lb-row-wide ${row.email===currentEmail?'me':''}`}>
            <span className={`lb-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}`}>{i+1}</span>
            <span className="lb-name">
              {row.name} {row.email===currentEmail && <span style={{color:'var(--kelly)',fontSize:11}}>YOU</span>}
            </span>
            <span className="lb-val pts">{row.totalPoints}</span>
            <span className="lb-val" style={{color:'var(--green)'}}>{row.totalWins}</span>
            <span className="lb-val" style={{color:'var(--red)'}}>{row.totalLosses}</span>
            <span className="lb-val" style={{color:'var(--gold)'}}>{row.totalPushes}</span>
            <span className="lb-val" style={{color:'var(--chalk-dim)'}}>{row.avgWager}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// HISTORY
// ============================================================
function HistoryView({ user }) {
  const picks = (DB.picks()[user.email]) || {};
  const games = DB.games();

  const byRound = {};
  Object.entries(picks).forEach(([gid, pick]) => {
    const r = pick.round;
    if (!byRound[r]) byRound[r] = [];
    const game = games.find(g => g.id === gid);
    byRound[r].push({ ...pick, game, gid });
  });

  const rounds = Object.keys(byRound).map(Number).sort((a,b)=>b-a);

  return (
    <div>
      <div className="round-banner">
        <div className="round-name">PICK HISTORY</div>
      </div>
      {rounds.length === 0 && <div className="empty-state">No picks yet. Head to MY PICKS to get started.</div>}
      {rounds.map(r => (
        <div key={r} className="history-round">
          <div className="history-round-title">{ROUNDS[r-1]?.name || `Round ${r}`}</div>
          {byRound[r].map(({ game, side, wager, gid }) => {
            if (!game) return null;
            const team = side === 'away' ? game.awayTeam : game.homeTeam;
            let badge = null;
            if (game.status === "final") {
              const { won, push } = calcResult(game, side);
              badge = push ? <span className="pick-result result-push">PUSH</span>
                : won ? <span className="pick-result result-win">WIN +{wager}</span>
                : <span className="pick-result result-loss">LOSS -{wager}</span>;
            } else {
              badge = <span className="pick-result result-pending">PENDING</span>;
            }
            return (
              <div key={gid} className="history-pick">
                <span className="history-game">{game.awayTeam} vs {game.homeTeam}</span>
                <span className="history-pick-team">▶ {team}</span>
                <span className="history-wager">{wager} pts</span>
                {badge}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ADMIN VIEW
// ============================================================
const BLANK_GAME = { awayTeam:'', awaySeed:'', homeTeam:'', homeSeed:'', spread:'', region:'South', gameTime:'', tipoff:'', lockedOverride: null };

function AdminView({ onRefresh }) {
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const currentRound = DB.currentRound();
  const roundStatuses = DB.roundStatus();
  const games = DB.games().filter(g => g.round === currentRound);
  const [localScores, setLocalScores] = useState(() => {
    const initial = {};
    DB.games().filter(g => g.round === currentRound).forEach(g => {
      initial[g.id] = { away: g.awayScore ?? "", home: g.homeScore ?? "" };
    });
    return initial;
  });
  const [localSpreads, setLocalSpreads] = useState(() => {
    const initial = {};
    DB.games().filter(g => g.round === currentRound).forEach(g => {
      initial[g.id] = g.spread?.toString() ?? "";
    });
    return initial;
  });
  const [newGame, setNewGame] = useState(BLANK_GAME);
  const [showAddGame, setShowAddGame] = useState(false);

  const flash = (text, type="success") => { setMsg(text); setMsgType(type); setTimeout(()=>setMsg(""), 3000); };

  const savespreads = () => {
    const allGames = DB.games();
    let updated = 0;
    Object.entries(localSpreads).forEach(([gid, val]) => {
      if (val === "") return;
      const g = allGames.find(x => x.id === gid);
      if (g) { g.spread = parseFloat(val); updated++; }
    });
    DB.saveGames(allGames);
    flash(`Updated spread${updated !== 1 ? 's' : ''} for ${updated} game${updated !== 1 ? 's' : ''}.`);
    setLocalSpreads({});
    onRefresh();
  };

  const submitScores = () => {
    const allGames = DB.games();
    let updated = 0;
    Object.entries(localScores).forEach(([gid, sc]) => {
      if (sc.away === "" || sc.home === "" || sc.away == null || sc.home == null) return;
      const g = allGames.find(x => x.id === gid);
      if (g) { g.awayScore = parseInt(sc.away); g.homeScore = parseInt(sc.home); g.status = "final"; updated++; }
    });
    DB.saveGames(allGames);
    flash(`Scores saved for ${updated} game${updated !== 1 ? 's' : ''}.`);
    onRefresh();
  };

  const addGame = () => {
    const { awayTeam, awaySeed, homeTeam, homeSeed, spread, region, gameTime, tipoff } = newGame;
    if (!awayTeam || !homeTeam || spread === "") return flash("Fill in both teams and a spread.", "error");
    const allGames = DB.games();
    const id = `g${Date.now()}`;
    allGames.push({ id, round: currentRound, region, awayTeam, awaySeed: parseInt(awaySeed)||0,
      homeTeam, homeSeed: parseInt(homeSeed)||0, spread: parseFloat(spread), status: "open",
      awayScore: null, homeScore: null, gameTime, tipoff: tipoff || null, lockedOverride: null });
    DB.saveGames(allGames);
    setNewGame(BLANK_GAME);
    setShowAddGame(false);
    flash(`Added: ${awayTeam} vs ${homeTeam}`);
    onRefresh();
  };

  const deleteGame = (gid) => {
    if (!window.confirm("Delete this game? Any picks on it will be orphaned.")) return;
    const allGames = DB.games().filter(g => g.id !== gid);
    DB.saveGames(allGames);
    flash("Game removed.");
    onRefresh();
  };

  const lockRound = () => {
    const s = DB.roundStatus();
    s[currentRound] = "locked";
    DB.saveRoundStatus(s);
    onRefresh(); flash("Round locked — no more picks accepted.");
  };

  const unlockRound = () => {
    const s = DB.roundStatus();
    s[currentRound] = "open";
    DB.saveRoundStatus(s);
    onRefresh(); flash("Round re-opened — picks accepted again.");
  };

  const advanceRound = () => {
    const s = DB.roundStatus();
    const nextRound = currentRound + 1;
    if (nextRound > 6) return flash("Tournament complete — no more rounds!");
    const unfinished = DB.games().filter(g => g.round === currentRound && g.status !== "final");
    if (unfinished.length > 0) return flash(`${unfinished.length} game(s) still missing final scores. Enter scores before advancing.`, "error");

    const allGames = DB.games();
    const picks = DB.picks();
    const users = DB.users();
    const roundGames = allGames.filter(g => g.round === currentRound);

    Object.entries(users).forEach(([email, u]) => {
      if (u.isAdmin) return;
      const myPicks = picks[email] || {};
      const startPts = u.rounds?.[currentRound] ?? 100;
      let pts = startPts;
      roundGames.forEach(game => {
        const pick = myPicks[game.id];
        if (!pick || pick.round !== currentRound) return;
        if (game.status === "final") {
          const { won, push } = calcResult(game, pick.side);
          if (!push) pts += won ? pick.wager : -pick.wager;
        }
      });
      u.rounds = u.rounds || {};
      u.rounds[nextRound] = Math.max(0, pts);
      u.history = u.history || [];
      u.history.push({ round: currentRound, startPts, endPts: pts });
    });

    DB.saveUsers(users);
    s[currentRound] = "complete";
    s[nextRound] = "open";
    DB.saveRoundStatus(s);
    DB.saveRound(nextRound);
    flash(`Advanced to ${ROUNDS[nextRound-1]?.name}! Point totals updated for all players.`);    onRefresh();
  };

  const toggleGameLock = (gid) => {
    const allGames = DB.games();
    const g = allGames.find(x => x.id === gid);
    if (!g) return;
    // Cycle: null (auto) → true (force locked) → false (force unlocked) → null
    if (g.lockedOverride === null || g.lockedOverride === undefined) g.lockedOverride = true;
    else if (g.lockedOverride === true) g.lockedOverride = false;
    else g.lockedOverride = null;
    DB.saveGames(allGames);
    flash(`Game lock updated.`);
    onRefresh();
  };
  const setScore = (gid, side, val) => setLocalScores(prev => ({ ...prev, [gid]: { ...prev[gid], [side]: val } }));
  const setSpread = (gid, val) => setLocalSpreads(prev => ({ ...prev, [gid]: val }));
  const setNG = (k, v) => setNewGame(prev => ({ ...prev, [k]: v }));

  const roundStatus = roundStatuses[currentRound] || "open";

  return (
    <div>
      <div className="round-banner">
        <div>
          <div className="round-name">COMMISSIONER PANEL</div>
          <div className="round-dates">{ROUNDS[currentRound-1]?.name} · {ROUNDS[currentRound-1]?.dates}</div>
        </div>
        <div className={`round-status status-${roundStatus}`}>
          {roundStatus === "open" ? "● PICKS OPEN" : roundStatus === "locked" ? "■ PICKS LOCKED" : "✓ COMPLETE"}
        </div>
      </div>

      {msg && <div className={msgType === "error" ? "error-msg" : "success-msg"}>{msg}</div>}

      {/* ── GAMES & SPREADS ── */}
      <div className="admin-section">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <div className="admin-title" style={{marginBottom:0}}>GAMES &amp; SPREADS — Round {currentRound}</div>
          <button className="btn btn-orange btn-sm" onClick={()=>setShowAddGame(v=>!v)}>
            {showAddGame ? "✕ CANCEL" : "+ ADD GAME"}
          </button>
        </div>

        {/* Add Game Form */}
        {showAddGame && (
          <div style={{background:'rgba(77,189,92,0.06)', border:'1px solid rgba(77,189,92,0.2)', padding:20, marginBottom:16}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 60px 1fr 60px', gap:8, marginBottom:8}}>
              <div className="field" style={{marginBottom:0}}>
                <label>AWAY TEAM</label>
                <input value={newGame.awayTeam} onChange={e=>setNG('awayTeam',e.target.value)} placeholder="e.g. Duke" />
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>SEED</label>
                <input type="number" value={newGame.awaySeed} onChange={e=>setNG('awaySeed',e.target.value)} placeholder="1" />
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>HOME TEAM</label>
                <input value={newGame.homeTeam} onChange={e=>setNG('homeTeam',e.target.value)} placeholder="e.g. Vermont" />
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>SEED</label>
                <input type="number" value={newGame.homeSeed} onChange={e=>setNG('homeSeed',e.target.value)} placeholder="16" />
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'120px 1fr 1fr 1fr', gap:8, marginBottom:12}}>
              <div className="field" style={{marginBottom:0}}>
                <label>SPREAD (away)</label>
                <input type="number" step="0.5" value={newGame.spread} onChange={e=>setNG('spread',e.target.value)} placeholder="-7.5" />
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>REGION</label>
                <select value={newGame.region} onChange={e=>setNG('region',e.target.value)}>
                  {REGIONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>DISPLAY TIME</label>
                <input value={newGame.gameTime} onChange={e=>setNG('gameTime',e.target.value)} placeholder="12:15 PM ET Thu" />
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>TIP-OFF DATE+TIME</label>
                <input type="datetime-local" value={newGame.tipoff} onChange={e=>setNG('tipoff',e.target.value)} />
              </div>
            </div>
            <button className="btn btn-green btn-sm" onClick={addGame}>✓ ADD GAME TO ROUND {currentRound}</button>
          </div>
        )}

        {games.length === 0 && <div className="empty-state">No games yet — add some above.</div>}
        {games.map(game => (
          <div key={game.id} className="admin-game-row" style={{flexWrap:'wrap', gap:10}}>
            <div className="admin-game-teams" style={{minWidth:200}}>
              <span style={{color:'var(--chalk-dim)'}}>#{game.awaySeed}</span> {game.awayTeam}
              <span style={{color:'var(--chalk-dim)'}}> vs </span>
              <span style={{color:'var(--chalk-dim)'}}>#{game.homeSeed}</span> {game.homeTeam}
            </div>

            {/* Spread edit */}
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <span className="admin-score-label" style={{marginRight:2}}>SPREAD</span>
              <input
                className="admin-score-inputs input"
                type="number" step="0.5"
                style={{width:72, background:'rgba(255,255,255,0.05)', border:'1px solid var(--line)', color:'var(--chalk)', padding:'5px 8px', fontFamily:'DM Mono,monospace', fontSize:13, outline:'none'}}
                value={localSpreads[game.id] ?? ""}
                onChange={e => setSpread(game.id, e.target.value)}
                onFocus={e => e.target.select()}
              />
            </div>

            {/* Score entry */}
            <div className="admin-score-inputs">
              <div>
                <div className="admin-score-label">{game.awayTeam.split(' ').pop()}</div>
                <input type="number" value={localScores[game.id]?.away ?? ""} onChange={e=>setScore(game.id,'away',e.target.value)} placeholder="--" />
              </div>
              <span style={{color:'var(--chalk-dim)',fontFamily:'DM Mono,monospace'}}>—</span>
              <div>
                <div className="admin-score-label">{game.homeTeam.split(' ').pop()}</div>
                <input type="number" value={localScores[game.id]?.home ?? ""} onChange={e=>setScore(game.id,'home',e.target.value)} placeholder="--" />
              </div>
            </div>

            <div style={{display:'flex', gap:6, marginLeft:'auto', alignItems:'center'}}>
              {game.status === "final" && <span className="tag tag-final">FINAL</span>}
              {/* Lock override toggle */}
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize:11,
                  color: game.lockedOverride === true ? 'var(--red)' : game.lockedOverride === false ? 'var(--green)' : isGameLocked(game) ? 'var(--red)' : 'var(--chalk-dim)',
                  borderColor: game.lockedOverride === true ? 'rgba(231,76,60,0.4)' : game.lockedOverride === false ? 'rgba(46,204,113,0.4)' : 'var(--line)'
                }}
                title="Click to cycle: Auto → Force Locked → Force Open"
                onClick={() => toggleGameLock(game.id)}>
                {game.lockedOverride === true ? '🔒 FORCED LOCK' : game.lockedOverride === false ? '🔓 FORCED OPEN' : isGameLocked(game) ? '🔒 AUTO-LOCKED' : '🟢 AUTO-OPEN'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--red)',borderColor:'rgba(231,76,60,0.3)',fontSize:11}}
                onClick={()=>deleteGame(game.id)}>✕</button>
            </div>
          </div>
        ))}

        {games.length > 0 && (
          <div style={{display:'flex', gap:10, marginTop:14}}>
            <button className="btn btn-orange btn-sm" onClick={savespreads}>SAVE SPREADS</button>
            <button className="btn btn-green btn-sm" onClick={submitScores}>SAVE SCORES</button>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* ── ROUND CONTROLS ── */}
      <div className="admin-section">
        <div className="admin-title">ROUND CONTROLS</div>
        <div style={{display:'flex', gap:12, flexWrap:'wrap', marginBottom:12}}>
          {roundStatus === "open" && (
            <button className="btn btn-red" onClick={lockRound}>🔒 LOCK ROUND {currentRound} — CLOSE PICKS</button>
          )}
          {roundStatus === "locked" && (
            <button className="btn btn-ghost" onClick={unlockRound}>🔓 RE-OPEN PICKS</button>
          )}
          {roundStatus !== "open" && currentRound < 6 && (
            <button className="btn btn-green" onClick={advanceRound}>
              ▶ SETTLE &amp; ADVANCE TO {ROUNDS[currentRound]?.name?.toUpperCase()}
            </button>
          )}
        </div>
        <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--chalk-dim)'}}>
          Round {currentRound} · {ROUNDS[currentRound-1]?.name} · {roundStatus.toUpperCase()} · {games.filter(g=>g.status==='final').length}/{games.length} games final
        </div>
      </div>

      <div className="divider" />

      {/* ── PLAYERS ── */}
      <AdminPlayers onRefresh={onRefresh} />
    </div>
  );
}




function AdminPlayers({ onRefresh }) {
  const currentRound = DB.currentRound();
  const [playerList, setPlayerList] = useState(Object.values(DB.users()).filter(u=>!u.isAdmin));
  const [editPts, setEditPts] = useState({});
  const [startPts, setStartPts] = useState(DB.startingPoints().toString());
  const [msg, setMsg] = useState("");

  const flash = (t) => { setMsg(t); setTimeout(()=>setMsg(""), 2500); };

  const saveStartingPoints = () => {
    const val = parseInt(startPts);
    if (!val || val < 1) return flash("Enter a valid number.");
    DB.saveStartingPoints(val);
    flash(`Starting points set to ${val}. New players will receive ${val} pts when they join.`);
  };

  const overridePoints = (email) => {
    const val = parseInt(editPts[email]);
    if (isNaN(val) || val < 0) return flash("Enter a valid point value.");
    const users = DB.users();
    users[email].rounds = users[email].rounds || {};
    users[email].rounds[currentRound] = val;
    DB.saveUsers(users);
    setPlayerList(Object.values(DB.users()).filter(u=>!u.isAdmin));
    flash(`Updated ${users[email].name} to ${val} pts.`);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="admin-section">
      {/* ── Global Starting Points ── */}
      <div className="admin-title">GAME SETTINGS</div>
      {msg && <div className="success-msg" style={{marginBottom:12}}>{msg}</div>}
      <div style={{background:'rgba(77,189,92,0.05)', border:'1px solid rgba(77,189,92,0.15)', padding:16, marginBottom:24}}>
        <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--chalk-dim)', letterSpacing:1, marginBottom:8}}>STARTING POINTS PER ROUND</div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <input
            type="number" min="1"
            style={{background:'rgba(255,255,255,0.05)', border:'1px solid var(--line)', color:'var(--chalk)', padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:18, width:120, outline:'none'}}
            value={startPts}
            onChange={e=>setStartPts(e.target.value)}
          />
          <button className="btn btn-orange btn-sm" onClick={saveStartingPoints}>SAVE</button>
          <span style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--chalk-dim)'}}>
            Currently: <strong style={{color:'var(--gold)'}}>{DB.startingPoints()} pts</strong> · Applied to new players &amp; new rounds
          </span>
        </div>
      </div>

      {/* ── Player List with Override ── */}
      <div className="admin-title">REGISTERED PLAYERS ({playerList.length})</div>
      {playerList.length === 0 && <div className="empty-state">No players registered yet.</div>}
      {playerList.map(u => {
        const pts = u.rounds?.[currentRound] ?? 0;
        return (
          <div key={u.email} className="admin-game-row" style={{flexWrap:'wrap', gap:10, alignItems:'center'}}>
            <div style={{flex:1, minWidth:140}}>
              <div style={{fontWeight:600, fontSize:15}}>{u.name}</div>
              <div style={{fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)'}}>{u.email}</div>
            </div>
            <span className="tag tag-open" style={{fontSize:13, padding:'4px 12px'}}>
              {pts} PTS
            </span>
            {/* Point override */}
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <div style={{fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)'}}>OVERRIDE</div>
              <input
                type="number" min="0"
                placeholder={pts.toString()}
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid var(--line)', color:'var(--chalk)', padding:'5px 10px', fontFamily:'DM Mono,monospace', fontSize:13, width:80, outline:'none'}}
                value={editPts[u.email] ?? ""}
                onChange={e => setEditPts(prev => ({...prev, [u.email]: e.target.value}))}
              />
              <button
                className="btn btn-orange btn-sm"
                style={{opacity: editPts[u.email] !== undefined && editPts[u.email] !== "" ? 1 : 0.4}}
                onClick={() => overridePoints(u.email)}>
                SET
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
