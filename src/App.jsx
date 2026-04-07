import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE CLIENT
// ============================================================
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ============================================================
// DESIGN: The Kelly Game
// ============================================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --court: #0a1a0e; --hardwood: #0f2415; --grain: #163320;
    --chalk: #f0f8f0; --chalk-dim: #8aaa8e;
    --kelly: #4dbd5c; --kelly-dim: #3a9e49;
    --green: #80e88f; --red: #e74c3c; --gold: #f0e040;
    --line: rgba(77,189,92,0.15);
  }
  body { background: var(--court); color: var(--chalk); font-family: 'Barlow Condensed', sans-serif; min-height: 100vh; }
  .app { min-height: 100vh; background: var(--court);
    background-image: repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(77,189,92,0.03) 80px, rgba(77,189,92,0.03) 81px),
    repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(77,189,92,0.03) 80px, rgba(77,189,92,0.03) 81px); }
  .header { background: var(--hardwood); border-bottom: 2px solid var(--kelly); padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; height: 64px;
    position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 24px rgba(0,0,0,0.6); }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; color: var(--kelly); text-shadow: 0 0 24px rgba(77,189,92,0.5); }
  .logo span { color: var(--chalk); }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .header-user { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--chalk-dim); }
  .header-points { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: var(--gold); background: rgba(240,192,64,0.1); border: 1px solid rgba(240,192,64,0.3); padding: 4px 12px; }
  .btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 1px; padding: 8px 20px; border: none; cursor: pointer; transition: all 0.15s; text-transform: uppercase; }
  .btn-kelly { background: var(--kelly); color: #0a1a0e; }
  .btn-kelly:hover { background: var(--kelly-dim); transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--chalk-dim); border: 1px solid var(--line); }
  .btn-ghost:hover { border-color: var(--chalk-dim); color: var(--chalk); }
  .btn-green { background: var(--green); color: #0a1a0e; }
  .btn-green:hover { background: #6dd87d; }
  .btn-red { background: var(--red); color: #fff; }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-full { width: 100%; margin-top: 8px; padding: 14px; font-size: 16px; }
  .nav { display: flex; gap: 2px; padding: 16px 24px 0; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .nav-tab { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 2px; padding: 8px 20px;
    cursor: pointer; color: var(--chalk-dim); border-bottom: 3px solid transparent; transition: all 0.15s;
    background: none; border-top: none; border-left: none; border-right: none; position: relative; }
  .nav-tab:hover { color: var(--chalk); }
  .nav-tab.active { color: var(--kelly); border-bottom-color: var(--kelly); }
  .main { padding: 24px; max-width: 1100px; margin: 0 auto; }
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-card { background: var(--hardwood); border: 1px solid var(--line); padding: 48px; width: 100%; max-width: 440px; position: relative; }
  .auth-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--kelly); }
  .auth-title { font-family: 'Bebas Neue', sans-serif; font-size: 48px; letter-spacing: 4px; color: var(--kelly); text-align: center; }
  .auth-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--chalk-dim); text-align: center; letter-spacing: 2px; margin-bottom: 40px; }
  .field { margin-bottom: 20px; }
  .field label { display: block; font-size: 11px; letter-spacing: 2px; color: var(--chalk-dim); margin-bottom: 6px; font-family: 'DM Mono', monospace; }
  .field input, .field select { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--line); color: var(--chalk); padding: 12px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 16px; outline: none; transition: border-color 0.15s; }
  .field input:focus, .field select:focus { border-color: var(--kelly); }
  .field select option { background: var(--hardwood); }
  .auth-switch { margin-top: 20px; text-align: center; font-size: 13px; color: var(--chalk-dim); }
  .auth-switch button { background: none; border: none; color: var(--kelly); cursor: pointer; font-family: inherit; font-size: 13px; text-decoration: underline; }
  .error-msg { background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.4); color: #ff8070; padding: 10px 16px; font-size: 13px; margin-bottom: 16px; font-family: 'DM Mono', monospace; }
  .success-msg { background: rgba(77,189,92,0.1); border: 1px solid rgba(77,189,92,0.3); color: var(--kelly); padding: 10px 16px; font-size: 13px; margin-bottom: 16px; font-family: 'DM Mono', monospace; }
  .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 4px; color: var(--kelly); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--kelly); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 12px; }
  .round-banner { background: var(--hardwood); border: 1px solid var(--line); padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .round-name { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 3px; color: var(--kelly); }
  .round-dates { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--chalk-dim); }
  .round-status { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1px; }
  .status-open { color: var(--kelly); } .status-locked { color: var(--red); } .status-complete { color: var(--chalk-dim); }
  .bank-warning { background: rgba(77,189,92,0.08); border: 1px solid rgba(77,189,92,0.3); padding: 10px 16px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--kelly); margin-bottom: 16px; }
  .summary-bar { background: var(--hardwood); border: 1px solid var(--line); padding: 16px 24px; margin-bottom: 24px; display: flex; gap: 32px; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; }
  .stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 36px; line-height: 1; }
  .stat-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 1px; }
  .stat-kelly { color: var(--kelly); } .stat-green { color: var(--green); } .stat-gold { color: var(--gold); } .stat-red { color: var(--red); }
  .games-grid { display: flex; flex-direction: column; gap: 12px; }
  .game-card { background: var(--hardwood); border: 1px solid var(--line); transition: border-color 0.15s; }
  .game-card:hover { border-color: rgba(245,240,232,0.2); }
  .game-header { padding: 10px 16px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
  .game-region { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 2px; }
  .game-time { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .game-body { padding: 16px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
  .team { display: flex; flex-direction: column; }
  .team-away { align-items: flex-start; } .team-home { align-items: flex-end; }
  .team-seed { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--kelly); }
  .team-name { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; line-height: 1; }
  .spread-center { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .spread-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 1px; }
  .spread-val { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--gold); }
  .at-sign { font-family: 'DM Mono', monospace; font-size: 14px; color: var(--chalk-dim); }
  .score-display { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: var(--chalk); }
  .score-final { color: var(--chalk-dim); font-size: 12px; font-family: 'DM Mono', monospace; }
  .pick-row { padding: 12px 16px; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .pick-btn { font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 1px; padding: 8px 16px; border: 1px solid var(--line); background: transparent; color: var(--chalk-dim); cursor: pointer; transition: all 0.15s; text-transform: uppercase; flex: 1; min-width: 120px; text-align: center; }
  .pick-btn:hover { border-color: var(--kelly); color: var(--kelly); }
  .pick-btn.selected { border-color: var(--kelly); background: rgba(77,189,92,0.15); color: var(--kelly); }
  .wager-input { background: rgba(255,255,255,0.05); border: 1px solid var(--line); color: var(--chalk); padding: 8px 12px; font-family: 'DM Mono', monospace; font-size: 14px; width: 90px; outline: none; }
  .wager-input:focus { border-color: var(--kelly); }
  .wager-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .pick-result { font-family: 'DM Mono', monospace; font-size: 11px; padding: 6px 12px; }
  .result-win { background: rgba(128,232,143,0.15); color: var(--green); border: 1px solid rgba(128,232,143,0.3); }
  .result-loss { background: rgba(231,76,60,0.15); color: var(--red); border: 1px solid rgba(231,76,60,0.3); }
  .result-push { background: rgba(240,224,64,0.15); color: var(--gold); border: 1px solid rgba(240,224,64,0.3); }
  .result-pending { background: rgba(255,255,255,0.05); color: var(--chalk-dim); border: 1px solid var(--line); }
  .leaderboard { background: var(--hardwood); border: 1px solid var(--line); }
  .lb-header { padding: 16px 24px; border-bottom: 1px solid var(--line); display: flex; align-items: baseline; gap: 12px; }
  .lb-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; color: var(--kelly); }
  .lb-round { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--chalk-dim); }
  .lb-row-header { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); letter-spacing: 1px; padding: 8px 24px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 48px 1fr repeat(5, 72px); }
  .lb-row { display: grid; grid-template-columns: 48px 1fr repeat(5, 72px); padding: 12px 24px; border-bottom: 1px solid var(--line); align-items: center; transition: background 0.1s; }
  .lb-row:hover { background: rgba(255,255,255,0.03); }
  .lb-row.me { background: rgba(77,189,92,0.08); border-left: 3px solid var(--kelly); }
  .lb-rank { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--chalk-dim); }
  .lb-rank.top1 { color: var(--gold); } .lb-rank.top2 { color: #aaa; } .lb-rank.top3 { color: #cd7f32; }
  .lb-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 18px; }
  .lb-val { font-family: 'DM Mono', monospace; font-size: 13px; text-align: right; }
  .lb-val.pts { color: var(--gold); font-size: 16px; font-weight: 500; }
  .history-round { margin-bottom: 24px; }
  .history-round-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--chalk-dim); padding: 12px 0; border-bottom: 1px solid var(--line); margin-bottom: 12px; }
  .history-pick { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; gap: 8px; flex-wrap: wrap; }
  .history-game { color: var(--chalk-dim); flex: 1; min-width: 120px; }
  .history-pick-team { color: var(--chalk); font-weight: 600; flex: 1; }
  .history-wager { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--chalk-dim); flex: 0 0 80px; text-align: right; }
  .admin-section { margin-bottom: 32px; }
  .admin-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; color: var(--kelly); margin-bottom: 16px; }
  .admin-game-row { background: var(--hardwood); border: 1px solid var(--line); padding: 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .admin-game-teams { flex: 1; font-size: 15px; font-weight: 600; }
  .admin-score-inputs { display: flex; gap: 8px; align-items: center; }
  .admin-score-inputs input { background: rgba(255,255,255,0.05); border: 1px solid var(--line); color: var(--chalk); padding: 6px 10px; font-family: 'DM Mono', monospace; font-size: 14px; width: 70px; outline: none; }
  .admin-score-inputs input:focus { border-color: var(--kelly); }
  .admin-score-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--chalk-dim); }
  .tag { font-family: 'DM Mono', monospace; font-size: 10px; padding: 3px 8px; letter-spacing: 1px; }
  .tag-open { background: rgba(77,189,92,0.15); color: var(--kelly); border: 1px solid rgba(77,189,92,0.3); }
  .tag-final { background: rgba(255,255,255,0.05); color: var(--chalk-dim); border: 1px solid var(--line); }
  .divider { height: 1px; background: var(--line); margin: 24px 0; }
  .empty-state { text-align: center; padding: 48px; color: var(--chalk-dim); font-family: 'DM Mono', monospace; font-size: 13px; }
  @media (max-width: 600px) {
    .game-body { grid-template-columns: 1fr; }
    .lb-row, .lb-row-header { grid-template-columns: 36px 1fr repeat(2, 60px); }
    .lb-row > *:nth-child(n+4), .lb-row-header > *:nth-child(n+4) { display: none; }
    .summary-bar { gap: 16px; }
  }
`;

const ROUNDS = [
  { num: 1, name: "Round of 64",  dates: "Thu–Fri, Mar 20–21" },
  { num: 2, name: "Round of 32",  dates: "Sat–Sun, Mar 22–23" },
  { num: 3, name: "Sweet 16",     dates: "Thu–Fri, Mar 27–28" },
  { num: 4, name: "Elite Eight",  dates: "Sat–Sun, Mar 29–30" },
  { num: 5, name: "Final Four",   dates: "Sat, Apr 5" },
  { num: 6, name: "Championship", dates: "Mon, Apr 7" },
];
const REGIONS   = ["South", "East", "Midwest", "West"];
const BLANK_GAME = { awayTeam:'', awaySeed:'', homeTeam:'', homeSeed:'', spread:'', region:'South', gameTime:'', tipoff:'' };

function isGameLocked(game) {
  if (game.locked_override === true)  return true;
  if (game.locked_override === false) return false;
  if (game.status === "final")        return true;  // always lock once scores saved
  if (!game.tipoff)                   return false;
  return new Date() >= new Date(game.tipoff);
}

function calcResult(game, side) {
  if (game.away_score === null || game.home_score === null) return { won: false, push: false };
  const awayFinal = Number(game.away_score) + Number(game.spread);
  if (awayFinal === Number(game.home_score)) return { won: false, push: true };
  return side === 'away'
    ? { won: awayFinal > Number(game.home_score), push: false }
    : { won: awayFinal < Number(game.home_score), push: false };
}

// Get a player's best available settled point total
// Checks: final → round 6 → round 5 → ... → round 1 → globalSP
function getBestPoints(u, globalSP) {
  if (u.rounds?.final !== undefined && u.rounds.final !== null) return u.rounds.final;
  for (let r = 6; r >= 1; r--) {
    if (u.rounds?.[r] !== undefined && u.rounds[r] !== null) return u.rounds[r];
  }
  return globalSP;
}

function formatCT(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      hour12: true
    }) + ' CT';
  } catch { return ts; }
}

// ── Supabase helpers ──────────────────────────────────────────
const DB = {
  async getSetting(key)       { const {data} = await supabase.from('settings').select('value').eq('key',key).single(); return data?.value ?? null; },
  async setSetting(key,value) { await supabase.from('settings').upsert({key,value}); },
  async currentRound()        { return parseInt(await DB.getSetting('current_round'))  || 1; },
  async startingPoints()      { return parseInt(await DB.getSetting('starting_points')) || 100; },
  async roundStatus()         { return (await DB.getSetting('round_status')) || {}; },
  async registrationLocked()  { return (await DB.getSetting('registration_locked')) === 'true'; },

  async getUser(email)  { const {data} = await supabase.from('users').select('*').eq('email',email.toLowerCase()).single(); return data; },
  async getAllUsers()    { const {data} = await supabase.from('users').select('*'); return data||[]; },
  async upsertUser(u)   { await supabase.from('users').upsert(u); },
  async updateUser(email, fields) { const {error} = await supabase.from('users').update(fields).eq('email', email); return error; },

  async getGames(round) { const q = supabase.from('games').select('*'); if(round) q.eq('round',round); const {data}=await q; return data||[]; },
  async upsertGame(g)   { await supabase.from('games').upsert(g); },
  async updateGame(id, fields) { const {error} = await supabase.from('games').update(fields).eq('id', id); return error; },
  async deleteGame(id)  { await supabase.from('games').delete().eq('id',id); },

  async getPicks(email)  { const {data} = await supabase.from('picks').select('*, games(*)').eq('email',email); return data||[]; },
  async getAllPicks()     { const {data} = await supabase.from('picks').select('*, games(*)').order('created_at', {ascending: true}); return data||[]; },
  async upsertPick(p)    { await supabase.from('picks').upsert(p,{onConflict:'email,game_id'}); },
  async deletePick(e,g)  { await supabase.from('picks').delete().eq('email',e).eq('game_id',g); },

  async getNotifications()       { const {data} = await supabase.from('notifications').select('*').order('created_at',{ascending:false}); return data||[]; },
  async addNotification(n)       { await supabase.from('notifications').insert(n); },
  async updateNotification(id,u) { await supabase.from('notifications').update(u).eq('id',id); },
  async deleteNotification(id)   { await supabase.from('notifications').delete().eq('id',id); },
  async clearNotifications()     { await supabase.from('notifications').delete().neq('id',0); },
  async resetAllGameData()       {
    // Read current starting points first
    const spData = await supabase.from('settings').select('value').eq('key','starting_points').single();
    const sp = parseInt(spData.data?.value) || 100;
    // Wipe picks, games, notifications
    await supabase.from('picks').delete().neq('id', 0);
    await supabase.from('games').delete().neq('id', 'x');
    await supabase.from('notifications').delete().neq('id', 0);
    // Reset all players
    const { data: users } = await supabase.from('users').select('*');
    for (const u of (users||[])) {
      if (u.is_admin) continue;
      await supabase.from('users').update({ rounds: { 1: sp }, history: [] }).eq('email', u.email);
    }
    // Reset all settings
    await supabase.from('settings').upsert({ key: 'current_round', value: '1' });
    await supabase.from('settings').upsert({ key: 'round_status', value: { 1: 'open' } });
    await supabase.from('settings').upsert({ key: 'tournament_complete', value: 'false' });
  },
};

// ============================================================
// APP
// ============================================================
export default function App() {
  const [user, setUser]         = useState(null);
  const [tab, setTab]           = useState("picks");
  const [loading, setLoading]   = useState(true);
  const [appData, setAppData]   = useState({ currentRound:1, startingPoints:100, roundStatus:{} });
  const [unread, setUnread]     = useState(0);
  const [liveWagered, setLiveWagered] = useState(0);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
    const saved = sessionStorage.getItem('kelly_session');
    if (saved) {
      const savedUser = JSON.parse(saved);
      // Always re-fetch fresh user data from DB to avoid stale points
      DB.getUser(savedUser.email).then(freshUser => {
        if (freshUser) {
          setUser(freshUser);
          sessionStorage.setItem('kelly_session', JSON.stringify(freshUser));
        } else {
          setUser(savedUser);
        }
      });
    }
    loadAppData();
    return () => document.head.removeChild(style);
  }, []);

  const loadAppData = async () => {
    const [cr, sp, rs, tc, rl] = await Promise.all([DB.currentRound(), DB.startingPoints(), DB.roundStatus(), DB.getSetting('tournament_complete'), DB.registrationLocked()]);
    setAppData({ currentRound:cr, startingPoints:sp, roundStatus:rs, tournamentComplete: tc === 'true', registrationLocked: rl });
    // Also refresh current user from DB so points are always fresh
    const saved = sessionStorage.getItem('kelly_session');
    if (saved) {
      const savedUser = JSON.parse(saved);
      const freshUser = await DB.getUser(savedUser.email);
      if (freshUser) {
        setUser(freshUser);
        sessionStorage.setItem('kelly_session', JSON.stringify(freshUser));
      }
    }
    setLoading(false);
  };

  const refreshUnread = async () => {
    const n = await DB.getNotifications();
    setUnread(n.filter(x=>!x.read).length);
  };

  useEffect(() => { if (user?.is_admin) refreshUnread(); }, [user]);

  const login = (u) => {
    setUser(u);
    sessionStorage.setItem('kelly_session', JSON.stringify(u));
    if (u.is_admin) refreshUnread();
  };
  const logout = () => { setUser(null); sessionStorage.removeItem('kelly_session'); setTab("picks"); };

  if (loading) return <div className="loading"><span className="spinner"/>LOADING THE KELLY GAME...</div>;
  if (!user)   return <AuthScreen onLogin={login} registrationLocked={appData.registrationLocked} />;

  // Use freshUser points from DB if available via session
  const savedSession = sessionStorage.getItem('kelly_session');
  const liveUser = savedSession ? JSON.parse(savedSession) : user;
  const startPts = liveUser.rounds?.[appData.currentRound] ?? 0;
  const pts = Math.max(0, startPts - liveWagered);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">THE KELLY<span> GAME</span></div>
        <div className="header-right">
          <span className="header-user">{liveUser.name}</span>
          {!liveUser.is_admin && <span className="header-points">{pts} PTS</span>}
          {!liveUser.is_admin && liveUser.paid === true && (
            <span style={{fontFamily:'DM Mono,monospace',fontSize:10,background:'rgba(77,189,92,0.1)',border:'1px solid rgba(77,189,92,0.3)',color:'var(--kelly)',padding:'3px 8px',letterSpacing:1}}>✓ PAID</span>
          )}
          {!liveUser.is_admin && liveUser.paid !== true && (
            <span style={{fontFamily:'DM Mono,monospace',fontSize:10,background:'rgba(231,76,60,0.15)',border:'1px solid rgba(231,76,60,0.4)',color:'var(--red)',padding:'3px 8px',letterSpacing:1}}>💳 UNPAID</span>
          )}
          {!liveUser.is_admin && <MessageCommissionerBtn user={liveUser} />}
          {liveUser.is_admin  && <span className="tag tag-open">ADMIN</span>}
          <button className="btn btn-ghost btn-sm" onClick={logout}>LOGOUT</button>
        </div>
      </header>
      <nav className="nav">
        {!liveUser.is_admin && <button className={`nav-tab ${tab==='picks'?'active':''}`}   onClick={()=>setTab('picks')}>MY PICKS</button>}
        <button                   className={`nav-tab ${tab==='board'?'active':''}`}    onClick={()=>{ setTab('board'); setLiveWagered(0); }}>LEADERBOARD</button>
        {!liveUser.is_admin && <button className={`nav-tab ${tab==='history'?'active':''}`} onClick={()=>{ setTab('history'); setLiveWagered(0); }}>HISTORY</button>}
        {!liveUser.is_admin && <button className={`nav-tab ${tab==='waglog'?'active':''}`}  onClick={()=>{ setTab('waglog'); setLiveWagered(0); }}>WAGER LOG</button>}
        {!liveUser.is_admin && <button className={`nav-tab ${tab==='rules'?'active':''}`}   onClick={()=>{ setTab('rules'); setLiveWagered(0); }}>RULES</button>}
        {liveUser.is_admin  && <button className={`nav-tab ${tab==='admin'?'active':''}`}   onClick={()=>setTab('admin')}>ADMIN</button>}
        {liveUser.is_admin  && <button className={`nav-tab ${tab==='tracker'?'active':''}`} onClick={()=>setTab('tracker')}>ROUND TRACKER</button>}
        {liveUser.is_admin  && <button className={`nav-tab ${tab==='wagers'?'active':''}`}  onClick={()=>setTab('wagers')}>WAGER LOG</button>}
        {liveUser.is_admin  && (
          <button className={`nav-tab ${tab==='notifications'?'active':''}`}
            onClick={()=>{ setTab('notifications'); refreshUnread(); }} style={{position:'relative'}}>
            NOTIFICATIONS
            {unread>0 && <span style={{position:'absolute',top:6,right:4,background:'var(--red)',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Mono,monospace'}}>{unread}</span>}
          </button>
        )}
      </nav>
      <main className="main">
        {tab==='picks'         && !liveUser.is_admin && <PicksView         user={liveUser} appData={appData} onWageredChange={setLiveWagered} onUserUpdate={(u)=>{ setUser(u); sessionStorage.setItem('kelly_session',JSON.stringify(u)); }} />}
        {tab==='board'         &&                      <LeaderboardView   currentEmail={liveUser.email} appData={appData} />}
        {tab==='history'       && !liveUser.is_admin && <HistoryView       user={liveUser} />}
        {tab==='waglog'        && !liveUser.is_admin && <PlayerWagerLogView />}
        {tab==='rules'         && !liveUser.is_admin && <RulesView         user={liveUser} appData={appData} />}
        {tab==='admin'         &&  liveUser.is_admin && <AdminView         appData={appData} onRefresh={loadAppData} />}
        {tab==='tracker'       &&  liveUser.is_admin && <RoundTrackerView  appData={appData} />}
        {tab==='wagers'        &&  liveUser.is_admin && <WagerLogView />}
        {tab==='notifications' &&  liveUser.is_admin && <NotificationsView onRefresh={refreshUnread} />}
      </main>
    </div>
  );
}

// ============================================================
// AUTH
// ============================================================
function AuthScreen({ onLogin, registrationLocked }) {
  const [mode, setMode]   = useState("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(""); setBusy(true);
    if (!email || !password) { setError("Email and password required."); setBusy(false); return; }
    if (mode === "login") {
      const u = await DB.getUser(email);
      if (!u || u.password !== btoa(password)) { setError("Invalid credentials."); setBusy(false); return; }
      onLogin(u);
    } else {
      if (registrationLocked) { setError("Registration is currently closed. Contact the commissioner to join."); setBusy(false); return; }
      if (!name) { setError("Name required."); setBusy(false); return; }
      const existing = await DB.getUser(email);
      if (existing) { setError("Email already registered."); setBusy(false); return; }
      const [cr, sp] = await Promise.all([DB.currentRound(), DB.startingPoints()]);
      const newUser = { email: email.toLowerCase(), name, password: btoa(password), is_admin: false, rounds: {[cr]: sp}, history: [] };
      await DB.upsertUser(newUser);
      onLogin(newUser);
    }
    setBusy(false);
  };

  const submitForgot = async () => {
    if (!forgotEmail) return; setBusy(true);
    const u = await DB.getUser(forgotEmail);
    if (!u) { setError("No account found with that email."); setBusy(false); return; }
    await DB.addNotification({ type:'forgot_password', email:forgotEmail.toLowerCase(), name:u.name, message:`${u.name} (${forgotEmail}) requested a password reset.`, read:false });
    setInfo("Request sent! The commissioner will reset your password shortly."); setBusy(false);
  };

  if (mode === "forgot") return (
    <div className="auth-wrap"><div className="auth-card">
      <div className="auth-title">THE KELLY GAME</div><div className="auth-sub">PASSWORD RESET</div>
      {error && <div className="error-msg">{error}</div>}
      {info ? (
        <><div className="success-msg">{info}</div>
          <button className="btn btn-ghost btn-full" onClick={()=>{ setMode("login"); setInfo(""); setForgotEmail(""); }}>BACK TO LOGIN</button></>
      ) : (
        <><div className="field"><label>YOUR EMAIL</label>
            <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==='Enter'&&submitForgot()} /></div>
          <button className="btn btn-kelly btn-full" onClick={submitForgot} disabled={busy}>SEND RESET REQUEST</button>
          <div className="auth-switch"><button onClick={()=>setMode("login")}>Back to login</button></div></>
      )}
    </div></div>
  );

  if (mode === "rules") return (
    <div className="auth-wrap" style={{alignItems:'flex-start', paddingTop:32}}>
      <div style={{width:'100%', maxWidth:640}}>
        <div style={{background:'var(--hardwood)', border:'1px solid var(--kelly)', padding:'20px 28px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{fontFamily:'Bebas Neue,sans-serif', fontSize:28, letterSpacing:3, color:'var(--kelly)'}}>THE KELLY GAME · RULES</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setMode("login")}>← BACK TO LOGIN</button>
        </div>
        <div style={{background:'rgba(77,189,92,0.06)', border:'1px solid rgba(77,189,92,0.2)', padding:20, marginBottom:16, fontFamily:'DM Mono,monospace', fontSize:12, color:'var(--chalk-dim)', lineHeight:1.9}}>
          <div style={{fontFamily:'Bebas Neue,sans-serif', fontSize:18, letterSpacing:2, color:'var(--kelly)', marginBottom:12}}>THE SHORT VERSION</div>
          {[
            "1. Every player starts with the same number of points — your bankroll for the game.",
            "2. Each round, pick teams against the point spread and wager your points.",
            "3. Win a pick → earn points equal to your wager. Lose → lose them.",
            "4. Your winnings carry forward — your point total becomes your starting balance next round.",
            "5. You must wager at least 50% of your points each round or forfeit the remainder.",
            "6. The player with the most points after the Championship wins. 🏆",
          ].map((r,i) => <div key={i} style={{marginBottom:4}}>{r}</div>)}
        </div>
        {[
          ["PICKING AGAINST THE SPREAD", "Every game has a point spread. The favorite must win by more than the spread to cover. The underdog just needs to keep it close or win outright. Example: if Duke is -8.5, they must win by 9+. If you pick Vermont +8.5, Vermont just needs to lose by 8 or fewer."],
          ["THE 50% RULE", "You MUST wager at least 50% of your starting points each round across your picks. If you start with 500 pts, you must wager at least 250. Fail to meet the minimum and your unwagered balance is forfeited for that round."],
          ["PICKS LOCK AT TIP-OFF", "Once a game tips off, picks for that game close — no changes allowed. Make sure you get your picks in early. The commissioner may also lock the round manually before the first tip."],
          ["WIN / LOSE / PUSH", "Win your pick → +wager pts. Lose → -wager pts. If the game lands exactly on the spread (a push) → wager returned, no gain or loss."],
          ["QUESTIONS?", "Use the ✉ MSG COMMISSIONER button after logging in to reach the commissioner directly. They have final say on all disputes and scoring corrections."],
        ].map(([title, body]) => (
          <div key={title} style={{background:'var(--hardwood)', border:'1px solid var(--line)', marginBottom:8, padding:'14px 20px'}}>
            <div style={{fontFamily:'Bebas Neue,sans-serif', fontSize:16, letterSpacing:2, color:'var(--chalk)', marginBottom:6}}>{title}</div>
            <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--chalk-dim)', lineHeight:1.8}}>{body}</div>
          </div>
        ))}
        <button className="btn btn-kelly btn-full" style={{marginTop:8}} onClick={()=>setMode("login")}>← BACK TO LOGIN</button>
      </div>
    </div>
  );

  return (
    <div className="auth-wrap"><div className="auth-card">
      <div className="auth-title">THE KELLY GAME</div><div className="auth-sub">NCAA TOURNAMENT · SPREAD GAME</div>
      {error && <div className="error-msg">{error}</div>}
      {mode==="register" && <div className="field"><label>YOUR NAME</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. John Smith" onKeyDown={e=>e.key==='Enter'&&submit()} /></div>}
      <div className="field"><label>EMAIL</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e=>e.key==='Enter'&&submit()} /></div>
      <div className="field"><label>PASSWORD</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()} /></div>
      <button className="btn btn-kelly btn-full" onClick={submit} disabled={busy}>{busy?"...":mode==="login"?"SIGN IN":"JOIN THE GAME"}</button>
      {mode==="login" && <div style={{textAlign:'center',marginTop:10}}><button style={{background:'none',border:'none',color:'var(--chalk-dim)',cursor:'pointer',fontFamily:'DM Mono,monospace',fontSize:11,textDecoration:'underline'}} onClick={()=>{ setMode("forgot"); setError(""); }}>Forgot password?</button></div>}
      <div className="auth-switch">
        {mode==="login"
          ? !registrationLocked && <>New player? <button onClick={()=>setMode("register")}>Create account</button></>
          : <>Already playing? <button onClick={()=>setMode("login")}>Sign in</button></>}
        {mode==="login" && registrationLocked && <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>Registration is currently closed.</span>}
      </div>
      {/* Rules link */}
      <div style={{textAlign:'center', marginTop:20, paddingTop:16, borderTop:'1px solid var(--line)'}}>
        <button onClick={()=>setMode("rules")} style={{background:'none', border:'none', color:'var(--kelly)', cursor:'pointer', fontFamily:'DM Mono,monospace', fontSize:11, letterSpacing:1, textDecoration:'underline'}}>
          📋 READ THE RULES BEFORE SIGNING UP
        </button>
      </div>
    </div></div>
  );
}

// ============================================================
// PICKS VIEW
// ============================================================
function PicksView({ user, appData, onWageredChange }) {
  const { currentRound, startingPoints: globalSP, roundStatus, tournamentComplete } = appData;
  const [games, setGames]         = useState([]);
  const [picks, setPicks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [freshUser, setFreshUser] = useState(user);
  const [tournamentCompleteLive, setTournamentCompleteLive] = useState(tournamentComplete);
  const roundLocked = roundStatus[currentRound] === "locked" || roundStatus[currentRound] === "complete";

  // Always pull fresh user from DB so points are never stale after a round advance
  const startingPoints = freshUser.rounds?.[currentRound] ?? globalSP;

  useEffect(() => { load(); }, [currentRound]);

  // Auto-refresh every 30s so game locks/scores propagate automatically
  useEffect(() => {
    const iv = setInterval(() => { silentLoad(); }, 30000);
    return () => clearInterval(iv);
  }, [currentRound]);

  const load = async () => {
    setLoading(true);
    const [g, p, u, tc] = await Promise.all([
      DB.getGames(currentRound),
      DB.getPicks(user.email),
      DB.getUser(user.email),
      DB.getSetting('tournament_complete'),
    ]);
    setGames(g);
    setPicks(p.filter(x=>x.round===currentRound));
    if (u) { setFreshUser(u); sessionStorage.setItem('kelly_session', JSON.stringify(u)); }
    // Override tournamentComplete from live DB value
    if (tc === 'false' || !tc) setTournamentCompleteLive(false);
    else if (tc === 'true') setTournamentCompleteLive(true);
    setLoading(false);
  };

  // Silent refresh — no loading spinner, just updates data in background
  const silentLoad = async () => {
    const [g, p, u, tc] = await Promise.all([
      DB.getGames(currentRound),
      DB.getPicks(user.email),
      DB.getUser(user.email),
      DB.getSetting('tournament_complete'),
    ]);
    setGames(g);
    setPicks(p.filter(x=>x.round===currentRound));
    if (u) { setFreshUser(u); sessionStorage.setItem('kelly_session', JSON.stringify(u)); }
    if (tc === 'false' || !tc) setTournamentCompleteLive(false);
    else if (tc === 'true') setTournamentCompleteLive(true);
  };

  const totalWagered = picks.reduce((s,p)=>s+(p.wager||0), 0);
  const minRequired  = Math.ceil(startingPoints * 0.5);
  const roundInfo    = ROUNDS[currentRound-1];

  // Keep parent header in sync with current wagered amount
  useEffect(() => {
    if (onWageredChange) onWageredChange(totalWagered);
  }, [totalWagered]);

  const savePick = async (gameId, side, wager) => {
    await DB.upsertPick({ email:user.email, game_id:gameId, round:currentRound, side, wager:parseInt(wager) });
    await load();
  };
  const clearPick = async (gameId) => { await DB.deletePick(user.email, gameId); await load(); };

  if (loading) return <div className="empty-state">Loading games...</div>;

  // If tournament is over, show final standings instead of picks
  if (tournamentCompleteLive) {
    return <FinalStandingsView currentEmail={user.email} />;
  }

  return (
    <div>
      {/* Unpaid banner */}
      {freshUser.paid !== true && (
        <div style={{background:'rgba(231,76,60,0.12)', border:'1px solid rgba(231,76,60,0.4)',
          padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontSize:20}}>💳</span>
          <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'#ff8070'}}>
            <strong style={{fontFamily:'Bebas Neue,sans-serif', fontSize:16, letterSpacing:1, display:'block'}}>ENTRY FEE OUTSTANDING</strong>
            Your entry fee has not been received yet. Please contact the commissioner to submit payment.
          </div>
        </div>
      )}
      <div className="round-banner">
        <div><div className="round-name">{roundInfo?.name||`Round ${currentRound}`}</div><div className="round-dates">{roundInfo?.dates}</div></div>
        <div className={`round-status status-${roundStatus[currentRound]||'open'}`}>
          {roundStatus[currentRound]==='locked'?'■ PICKS LOCKED':roundStatus[currentRound]==='complete'?'✓ COMPLETE':'● PICKS OPEN'}
        </div>
      </div>
      <div className="summary-bar">
        <div className="stat"><span className="stat-val stat-gold">{startingPoints}</span><span className="stat-label">STARTING PTS</span></div>
        <div className="stat"><span className="stat-val stat-kelly">{totalWagered}</span><span className="stat-label">WAGERED</span></div>
        <div className="stat"><span className={`stat-val ${startingPoints-totalWagered>=0?'stat-green':'stat-red'}`}>{startingPoints-totalWagered}</span><span className="stat-label">REMAINING</span></div>
        <div className="stat"><span className={`stat-val ${totalWagered>=minRequired?'stat-green':'stat-red'}`}>{minRequired}</span><span className="stat-label">MIN REQUIRED (50%)</span></div>
      </div>
      {/* Lock-in reminder */}
      {!roundLocked && (
        <div style={{background:'rgba(77,189,92,0.07)', border:'1px solid rgba(77,189,92,0.25)',
          padding:'12px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontSize:18}}>💡</span>
          <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--chalk-dim)', lineHeight:1.7}}>
            <strong style={{color:'var(--kelly)'}}>HOW TO LOCK IN YOUR PICKS:</strong> Select a team, enter your wager amount, then click <strong style={{color:'var(--kelly)'}}>LOCK IN</strong>.
            Your pick is only saved when you see the <strong style={{color:'var(--red)'}}>red LOCKED IN ✓ button</strong>.
            View all confirmed picks in your <strong style={{color:'var(--kelly)'}}>HISTORY</strong> tab.
          </div>
        </div>
      )}
      {!roundLocked && totalWagered < minRequired && (
        <div style={{background:'rgba(231,76,60,0.15)', border:'2px solid var(--red)', padding:'14px 20px',
          marginBottom:16, display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontSize:24}}>⚠️</span>
          <div>
            <div style={{fontFamily:'Bebas Neue,sans-serif', fontSize:20, letterSpacing:2, color:'var(--red)', lineHeight:1}}>
              50% MINIMUM NOT MET — FORFEIT WARNING
            </div>
            <div style={{fontFamily:'DM Mono,monospace', fontSize:11, color:'#ff8070', marginTop:4, lineHeight:1.6}}>
              You must wager at least <strong>{minRequired} pts</strong> this round. Currently wagered: <strong>{totalWagered} pts</strong>. Still need: <strong>{minRequired - totalWagered} more pts</strong>.<br/>
              <span style={{color:'var(--red)',fontWeight:700}}>If you do not reach the 50% minimum before picks lock, your unwagered balance will be forfeited for this round.</span>
            </div>
          </div>
        </div>
      )}
      <div className="games-grid">
        {games.length===0 && <div className="empty-state">No games scheduled for this round yet.</div>}
        {[...games].sort((a,b) => {
          if (!a.tipoff && !b.tipoff) return 0;
          if (!a.tipoff) return 1;
          if (!b.tipoff) return -1;
          return new Date(a.tipoff) - new Date(b.tipoff);
        }).map(game => {
          const myPick = picks.find(p=>p.game_id===game.id);
          return <GameCard key={game.id} game={game} myPick={myPick}
            locked={roundLocked||isGameLocked(game)} gameLocked={isGameLocked(game)}
            startingPoints={startingPoints} totalWagered={totalWagered}
            onPick={savePick} onClear={clearPick} />;
        })}
      </div>
    </div>
  );
}

function GameCard({ game, myPick, locked, gameLocked, startingPoints, totalWagered, onPick, onClear }) {
  const [localSide,  setLocalSide]  = useState(myPick?.side||null);
  const [localWager, setLocalWager] = useState(myPick?.wager?.toString()||"");
  const [saving, setSaving]         = useState(false);

  useEffect(() => { setLocalSide(myPick?.side||null); setLocalWager(myPick?.wager?.toString()||""); }, [myPick]);

  const otherWagered    = totalWagered - (myPick?.wager||0);
  const availablePoints = startingPoints - otherWagered;
  const isAway          = game.spread < 0;
  const spreadDisplay   = game.spread > 0 ? `+${game.spread}` : `${game.spread}`;

  const commitPick = async () => {
    if (!localSide || !localWager || parseInt(localWager)<=0) return;
    const wager = parseInt(localWager);
    if (wager > availablePoints) { alert(`Only ${availablePoints} points available.`); return; }
    setSaving(true); await onPick(game.id, localSide, wager); setSaving(false);
  };

  const handleWagerChange = (e) => {
    const v = parseInt(e.target.value);
    setLocalWager(v > availablePoints ? availablePoints.toString() : e.target.value);
  };

  let resultEl = null;
  if (myPick && game.status==="final") {
    const {won,push} = calcResult(game, myPick.side);
    if (push)     resultEl = <span className="pick-result result-push">PUSH — {myPick.wager} pts returned</span>;
    else if (won) resultEl = <span className="pick-result result-win">WIN +{myPick.wager} pts</span>;
    else          resultEl = <span className="pick-result result-loss">LOSS -{myPick.wager} pts</span>;
  } else if (myPick) {
    resultEl = <span className="pick-result result-pending">PENDING · {myPick.wager} pts</span>;
  }

  return (
    <div className="game-card">
      <div className="game-header">
        <span className="game-region">{game.region?.toUpperCase()} REGION</span>
        <span className="game-time">{game.game_time}</span>
      </div>
      <div className="game-body">
        <div className="team team-away">
          <span className="team-seed">#{game.away_seed}</span>
          <span className="team-name">{game.away_team}</span>
          {game.status==="final" && <span className="score-display">{game.away_score}</span>}
        </div>
        <div className="spread-center">
          <span className="spread-label">SPREAD</span>
          <span className="spread-val">{spreadDisplay}</span>
          <span className="at-sign">@</span>
          {game.tipoff && game.status !== "final" && (
            <span style={{fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)', textAlign:'center', lineHeight:1.4}}>
              {formatCT(game.tipoff)}
            </span>
          )}
          {game.status==="final" && <span className="score-final">FINAL</span>}
        </div>
        <div className="team team-home">
          <span className="team-seed">#{game.home_seed}</span>
          <span className="team-name">{game.home_team}</span>
          {game.status==="final" && <span className="score-display">{game.home_score}</span>}
        </div>
      </div>
      <div className="pick-row">
        {!locked ? (
          <>
            <button className={`pick-btn ${localSide==='away'?'selected':''}`} onClick={()=>setLocalSide('away')}>
              {isAway?`${game.away_team} ${game.spread}`:`${game.away_team} +${Math.abs(game.spread)}`}
            </button>
            <button className={`pick-btn ${localSide==='home'?'selected':''}`} onClick={()=>setLocalSide('home')}>
              {!isAway?`${game.home_team} ${game.spread}`:`${game.home_team} +${Math.abs(game.spread)}`}
            </button>
            {localSide && (<>
              <div>
                <div className="wager-label">WAGER <span style={{color:'var(--chalk-dim)'}}>/ {availablePoints} avail</span></div>
                <input className="wager-input" type="number" min="1" max={availablePoints} value={localWager} onChange={handleWagerChange} placeholder="pts" />
              </div>
              {myPick
                ? <button className="btn btn-sm" style={{background:'var(--red)',color:'#fff',cursor:'default'}}>LOCKED IN ✓</button>
                : <button className="btn btn-kelly btn-sm" onClick={commitPick} disabled={saving}>{saving?'...':'LOCK IN'}</button>}
              {myPick && <button className="btn btn-ghost btn-sm" onClick={()=>{ onClear(game.id); setLocalSide(null); setLocalWager(''); }}>CLEAR</button>}
            </>)}
          </>
        ) : (
          <>
            {gameLocked && game.status!=="final" && <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--red)',background:'rgba(231,76,60,0.1)',border:'1px solid rgba(231,76,60,0.3)',padding:'5px 12px',letterSpacing:1}}>🔒 GAME IN PROGRESS — PICKS CLOSED</span>}
            {myPick && <span style={{fontSize:14,color:'var(--chalk)'}}>Picked: <strong>{myPick.side==='away'?game.away_team:game.home_team}</strong> for <strong>{myPick.wager} pts</strong></span>}
            {!myPick && !gameLocked && <span style={{fontSize:13,color:'var(--chalk-dim)',fontFamily:'DM Mono,monospace'}}>No pick submitted</span>}
            {resultEl}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LEADERBOARD
// ============================================================
function LeaderboardView({ currentEmail, appData }) {
  const { currentRound, startingPoints: globalSP } = appData;
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [currentRound]);

  const load = async () => {
    setLoading(true);
    const [users, allPicks, allGames, rs] = await Promise.all([DB.getAllUsers(), DB.getAllPicks(), DB.getGames(), DB.roundStatus()]);
    const built = users.filter(u=>!u.is_admin).map(u => {
      const myPicks = allPicks.filter(p=>p.email===u.email);
      let totalWins=0, totalLosses=0, totalPushes=0, totalWagered=0;

      // Count cumulative W/L/Push across all picks
      myPicks.forEach(pick => {
        const game = allGames.find(g=>g.id===pick.game_id) || pick.games;
        totalWagered += pick.wager||0;
        if (game?.status==="final") {
          const {won,push} = calcResult(game, pick.side);
          if (push) totalPushes++;
          else if (won) totalWins++;
          else totalLosses++;
        }
      });

      // For points: use the settled value from user.rounds for past rounds,
      // and only add/subtract current round's unsettled picks on top
      const roundStatus = rs || {};
      const currentRoundSettled = roundStatus[currentRound] === "complete";

      let totalPoints;
      if (currentRoundSettled) {
        // Round is complete — use best settled value, no recalculation
        totalPoints = getBestPoints(u, globalSP);
      } else {
        // Round in progress — start from settled balance and add current picks
        totalPoints = u.rounds?.[currentRound] ?? globalSP;
        myPicks.filter(p=>p.round===currentRound).forEach(pick => {
          const game = allGames.find(g=>g.id===pick.game_id) || pick.games;
          if (game?.status==="final") {
            const {won,push} = calcResult(game, pick.side);
            if (!push) totalPoints += won ? pick.wager : -pick.wager;
          }
        });
      }

      return { ...u, totalPoints, totalWins, totalLosses, totalPushes, avgWager: myPicks.length>0?Math.round(totalWagered/myPicks.length):0 };
    }).sort((a,b)=>b.totalPoints-a.totalPoints);
    setRows(built); setLoading(false);
  };

  return (
    <div>
      <div className="round-banner">
        <div className="round-name">LEADERBOARD</div>
        <div className="round-dates">{ROUNDS[currentRound-1]?.name}</div>
      </div>
      <div className="leaderboard">
        <div className="lb-header"><span className="lb-title">STANDINGS</span><span className="lb-round">Round {currentRound} · Cumulative</span></div>
        <div className="lb-row-header">
          <span>#</span><span>PLAYER</span>
          <span style={{textAlign:'right'}}>POINTS</span><span style={{textAlign:'right'}}>W</span>
          <span style={{textAlign:'right'}}>L</span><span style={{textAlign:'right'}}>PUSH</span><span style={{textAlign:'right'}}>AVG BET</span>
        </div>
        {loading && <div className="empty-state">Loading...</div>}
        {!loading && rows.length===0 && <div className="empty-state">No players yet.</div>}
        {rows.map((row,i) => (
          <div key={row.email} className={`lb-row ${row.email===currentEmail?'me':''}`}>
            <span className={`lb-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}`}>{i+1}</span>
            <span className="lb-name">{row.name} {row.email===currentEmail&&<span style={{color:'var(--kelly)',fontSize:11}}>YOU</span>}</span>
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
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { DB.getPicks(user.email).then(p=>{ setPicks(p); setLoading(false); }); }, []);

  const byRound = {};
  picks.forEach(p => { if(!byRound[p.round]) byRound[p.round]=[]; byRound[p.round].push(p); });
  const rounds = Object.keys(byRound).map(Number).sort((a,b)=>b-a);

  if (loading) return <div className="empty-state">Loading history...</div>;
  return (
    <div>
      <div className="round-banner"><div className="round-name">PICK HISTORY</div></div>
      {rounds.length===0 && <div className="empty-state">No picks yet.</div>}
      {rounds.map(r => (
        <div key={r} className="history-round">
          <div className="history-round-title">{ROUNDS[r-1]?.name||`Round ${r}`}</div>
          {byRound[r].map(pick => {
            const game = pick.games; if(!game) return null;
            const isAway = pick.side === 'away';
            const team = isAway ? game.away_team : game.home_team;
            const spread = game.spread;
            const spreadLabel = isAway
              ? (spread < 0 ? spread : `+${Math.abs(spread)}`)
              : (spread < 0 ? `+${Math.abs(spread)}` : spread);
            let badge = null;
            if (game.status==="final") {
              const {won,push} = calcResult(game, pick.side);
              badge = push?<span className="pick-result result-push">PUSH</span>
                :won?<span className="pick-result result-win">WIN +{pick.wager}</span>
                :<span className="pick-result result-loss">LOSS -{pick.wager}</span>;
            } else badge = <span className="pick-result result-pending">PENDING</span>;
            return (
              <div key={pick.id} className="history-pick">
                <span className="history-game">{game.away_team} vs {game.home_team}
                  {game.status==="final" && <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',marginLeft:8}}>{game.away_score}–{game.home_score}</span>}
                </span>
                <span className="history-pick-team">▶ {team} <span style={{color:'var(--gold)',fontFamily:'DM Mono,monospace',fontSize:11}}>{spreadLabel}</span></span>
                <span className="history-wager">{pick.wager} pts</span>
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
function AdminView({ appData, onRefresh }) {
  const { currentRound: activeRound } = appData;
  const [adminRound, setAdminRound] = useState(activeRound);
  const [games, setGames]           = useState([]);
  const [roundStatus, setRoundStatus] = useState(appData.roundStatus || {});
  const [msg, setMsg]               = useState(""); const [msgType, setMsgType] = useState("success");
  const [localScores, setLocalScores]   = useState({});
  const [localSpreads, setLocalSpreads] = useState({});
  const [newGame, setNewGame]     = useState(BLANK_GAME);
  const [showAdd, setShowAdd]     = useState(false);

  useEffect(() => { loadGames(adminRound); }, [adminRound]);
  useEffect(() => { setRoundStatus(appData.roundStatus || {}); }, [appData.roundStatus]);

  const loadGames = async (r) => {
    const g = await DB.getGames(r);
    setGames(g);
    const sc={}, sp={};
    g.forEach(x=>{ sc[x.id]={away:x.away_score??'',home:x.home_score??''}; sp[x.id]=x.spread?.toString()??''; });
    setLocalScores(sc); setLocalSpreads(sp);
  };

  const reloadRoundStatus = async () => {
    const rs = await DB.roundStatus();
    setRoundStatus(rs);
    return rs;
  };

  const flash = (t, type="success") => { setMsg(t); setMsgType(type); setTimeout(()=>setMsg(""),3000); };

  const setActiveRound = async (r) => {
    const rNum = parseInt(r);
    const rs = await reloadRoundStatus();
    if (!rs[rNum]) rs[rNum]="open";
    await Promise.all([DB.setSetting('current_round',rNum.toString()), DB.setSetting('round_status',rs)]);

    // Seed all players with starting points for this round if they don't have an entry yet
    const [allUsers, sp] = await Promise.all([DB.getAllUsers(), DB.startingPoints()]);
    for (const u of allUsers) {
      if (u.is_admin) continue;
      if (u.rounds?.[rNum] === undefined || u.rounds?.[rNum] === null) {
        const rounds = { ...(u.rounds || {}), [rNum]: sp };
        await DB.updateUser(u.email, { rounds });
      }
    }

    setAdminRound(rNum);
    setRoundStatus({...rs});
    flash(`Active round set to ${ROUNDS[rNum-1]?.name}. All players seeded with ${sp} pts.`);
    onRefresh();
  };

  const saveSpreads = async () => {
    let n=0;
    for (const [id,val] of Object.entries(localSpreads)) {
      if (val==="") continue;
      await DB.updateGame(id, { spread: parseFloat(val) }); n++;
    }
    flash(`Updated spreads for ${n} game(s).`);
    // Only reload game metadata, preserve score inputs by merging
    const g = await DB.getGames(adminRound);
    setGames(g);
    // Update spreads in localSpreads from DB but DON'T reset localScores
    const sp={};
    g.forEach(x=>{ sp[x.id]=x.spread?.toString()??''; });
    setLocalSpreads(sp);
  };

  const saveScores = async () => {
    let n=0;
    for (const [id,sc] of Object.entries(localScores)) {
      if (sc.away===""||sc.home===""||sc.away==null||sc.home==null) continue;
      await DB.updateGame(id, { away_score: parseInt(sc.away), home_score: parseInt(sc.home), status: "final" }); n++;
    }
    if (n === 0) {
      flash("No scores to save — enter scores in both home and away fields first.", "error");
      return;
    }
    flash(`Scores saved for ${n} game(s).`);
    // Reload everything fresh after saving
    loadGames(adminRound);
  };

  const addGame = async () => {
    const {awayTeam,awaySeed,homeTeam,homeSeed,spread,region,gameTime,tipoff} = newGame;
    if (!awayTeam||!homeTeam||spread==="") return flash("Fill in both teams and a spread.","error");
    const id = `g${Date.now()}`;
    await DB.upsertGame({ id, round:adminRound, region, away_team:awayTeam, away_seed:parseInt(awaySeed)||0,
      home_team:homeTeam, home_seed:parseInt(homeSeed)||0, spread:parseFloat(spread),
      status:"open", away_score:null, home_score:null, game_time:gameTime, tipoff:tipoff||null, locked_override:null });
    setNewGame(BLANK_GAME); setShowAdd(false);
    flash(`Added: ${awayTeam} vs ${homeTeam}`); loadGames(adminRound);
  };

  const deleteGame = async (id) => {
    if (!window.confirm("Delete this game?")) return;
    await DB.deleteGame(id); flash("Game removed."); loadGames(adminRound);
  };

  const toggleLock = async (game) => {
    const next = game.locked_override===null||game.locked_override===undefined ? true : game.locked_override===true ? false : null;
    await DB.updateGame(game.id, { locked_override: next }); flash("Lock updated."); loadGames(adminRound);
  };

  const lockRound = async () => {
    const rs = await reloadRoundStatus();
    rs[adminRound]="locked";
    await DB.setSetting('round_status', rs);
    setRoundStatus({...rs});
    flash(`Round ${adminRound} locked — picks closed.`);
    onRefresh();
  };

  const unlockRound = async () => {
    const rs = await reloadRoundStatus();
    rs[adminRound]="open";
    await DB.setSetting('round_status', rs);
    setRoundStatus({...rs});
    flash(`Round ${adminRound} re-opened.`);
    onRefresh();
  };

  const advanceRound = async () => {
    const nextRound = adminRound+1;
    if (nextRound>6) return flash("Tournament complete!");
    const unfinished = games.filter(g=>g.status!=="final");
    if (unfinished.length>0) return flash(`${unfinished.length} game(s) missing scores.`,"error");
    const [allPicks, allUsers, sp] = await Promise.all([DB.getAllPicks(), DB.getAllUsers(), DB.startingPoints()]);
    const roundPicks = allPicks.filter(p=>p.round===adminRound);
    for (const u of allUsers) {
      if (u.is_admin) continue;
      const myPicks = roundPicks.filter(p=>p.email===u.email);
      const startPts = u.rounds?.[adminRound] ?? sp;
      let pts = startPts;
      myPicks.forEach(pick => {
        const game = games.find(g=>g.id===pick.game_id);
        if (!game||game.status!=="final") return;
        const {won,push} = calcResult(game, pick.side);
        if (!push) pts += won ? pick.wager : -pick.wager;
      });
      const rounds = {...(u.rounds||{}), [nextRound]: Math.max(0,pts)};
      const history = [...(u.history||[]), {round:adminRound, startPts, endPts:pts}];
      await DB.upsertUser({...u, rounds, history});
    }
    const rs = await reloadRoundStatus();
    rs[adminRound]="complete"; rs[nextRound]="open";
    await Promise.all([DB.setSetting('round_status',rs), DB.setSetting('current_round',nextRound.toString())]);
    setRoundStatus({...rs});
    setAdminRound(nextRound); flash(`Advanced to ${ROUNDS[nextRound-1]?.name}!`); onRefresh(); loadGames(nextRound);
  };

  const closeChampionship = async () => {
    const unfinished = games.filter(g=>g.status!=="final");
    if (unfinished.length>0) return flash(`${unfinished.length} game(s) missing scores.`,"error");
    if (!window.confirm("Close the Championship and finalize all standings? This ends The Kelly Game.")) return;

    const [allPicks, allUsers, sp] = await Promise.all([DB.getAllPicks(), DB.getAllUsers(), DB.startingPoints()]);
    const roundPicks = allPicks.filter(p=>p.round===6);
    for (const u of allUsers) {
      if (u.is_admin) continue;
      const myPicks = roundPicks.filter(p=>p.email===u.email);
      const startPts = u.rounds?.[6] ?? sp;
      let pts = startPts;
      myPicks.forEach(pick => {
        const game = games.find(g=>g.id===pick.game_id);
        if (!game||game.status!=="final") return;
        const {won,push} = calcResult(game, pick.side);
        if (!push) pts += won ? pick.wager : -pick.wager;
      });
      const rounds = {...(u.rounds||{}), 6: Math.max(0,pts), final: Math.max(0,pts)};
      const history = [...(u.history||[]), {round:6, startPts, endPts:pts}];
      await DB.upsertUser({...u, rounds, history});
    }
    const rs = await reloadRoundStatus();
    rs[6]="complete";
    await Promise.all([
      DB.setSetting('round_status', rs),
      DB.setSetting('tournament_complete', 'true'),
    ]);
    setRoundStatus({...rs});
    flash("🏆 Championship closed! Final standings are now live for all players.");
    onRefresh();
  };
  const setScore  = (id,side,val) => setLocalScores(p=>({...p,[id]:{...p[id],[side]:val}}));
  const setSpread = (id,val)      => setLocalSpreads(p=>({...p,[id]:val}));
  const setNG     = (k,v)         => setNewGame(p=>({...p,[k]:v}));
  const rsVal = roundStatus[adminRound]||"open";

  return (
    <div>
      <div className="round-banner" style={{flexWrap:'wrap',gap:12}}>
        <div>
          <div className="round-name">COMMISSIONER PANEL</div>
          <div className="round-dates">{ROUNDS[adminRound-1]?.name} · {ROUNDS[adminRound-1]?.dates}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',letterSpacing:1}}>VIEW/EDIT ROUND</div>
          <select value={adminRound} onChange={e=>{setAdminRound(parseInt(e.target.value));setShowAdd(false);setMsg('');}}
            style={{background:'var(--grain)',border:'1px solid var(--line)',color:'var(--chalk)',padding:'6px 10px',fontFamily:'DM Mono,monospace',fontSize:13,outline:'none',cursor:'pointer'}}>
            {ROUNDS.map(r=><option key={r.num} value={r.num}>{r.name}{r.num===activeRound?' ← ACTIVE':''}</option>)}
          </select>
          {adminRound!==activeRound && <button className="btn btn-green btn-sm" onClick={()=>setActiveRound(adminRound)}>SET AS ACTIVE ROUND</button>}
          <div className={`round-status status-${rsVal}`}>{rsVal==='open'?'● PICKS OPEN':rsVal==='locked'?'■ PICKS LOCKED':'✓ COMPLETE'}</div>
        </div>
      </div>

      {msg && <div className={msgType==="error"?"error-msg":"success-msg"}>{msg}</div>}

      <div className="admin-section">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div className="admin-title" style={{marginBottom:0}}>GAMES &amp; SPREADS — {ROUNDS[adminRound-1]?.name}</div>
          <button className="btn btn-kelly btn-sm" onClick={()=>setShowAdd(v=>!v)}>{showAdd?"✕ CANCEL":"+ ADD GAME"}</button>
        </div>

        {showAdd && (
          <div style={{background:'rgba(77,189,92,0.06)',border:'1px solid rgba(77,189,92,0.2)',padding:20,marginBottom:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 60px 1fr 60px',gap:8,marginBottom:8}}>
              <div className="field" style={{marginBottom:0}}><label>FAVORITE (away)</label><input value={newGame.awayTeam} onChange={e=>setNG('awayTeam',e.target.value)} placeholder="Duke" /></div>
              <div className="field" style={{marginBottom:0}}><label>SEED</label><input type="number" value={newGame.awaySeed} onChange={e=>setNG('awaySeed',e.target.value)} placeholder="1" /></div>
              <div className="field" style={{marginBottom:0}}><label>UNDERDOG (home)</label><input value={newGame.homeTeam} onChange={e=>setNG('homeTeam',e.target.value)} placeholder="Vermont" /></div>
              <div className="field" style={{marginBottom:0}}><label>SEED</label><input type="number" value={newGame.homeSeed} onChange={e=>setNG('homeSeed',e.target.value)} placeholder="16" /></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr 1fr',gap:8,marginBottom:12}}>
              <div className="field" style={{marginBottom:0}}><label>SPREAD</label><input type="number" step="0.5" value={newGame.spread} onChange={e=>setNG('spread',e.target.value)} placeholder="-7.5" /></div>
              <div className="field" style={{marginBottom:0}}><label>REGION</label><select value={newGame.region} onChange={e=>setNG('region',e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></div>
              <div className="field" style={{marginBottom:0}}><label>DISPLAY TIME</label><input value={newGame.gameTime} onChange={e=>setNG('gameTime',e.target.value)} placeholder="12:15 PM ET Thu" /></div>
              <div className="field" style={{marginBottom:0}}><label>TIP-OFF DATE+TIME</label><input type="datetime-local" value={newGame.tipoff} onChange={e=>setNG('tipoff',e.target.value)} /></div>
            </div>
            <button className="btn btn-green btn-sm" onClick={addGame}>✓ ADD GAME TO {ROUNDS[adminRound-1]?.name?.toUpperCase()}</button>
          </div>
        )}

        {games.length===0 && <div className="empty-state">No games yet — add some above.</div>}
        {games.map(game => (
          <div key={game.id} className="admin-game-row" style={{flexWrap:'wrap',gap:10}}>
            <div className="admin-game-teams" style={{minWidth:200}}>
              <span style={{color:'var(--chalk-dim)'}}>#{game.away_seed}</span> {game.away_team}
              <span style={{color:'var(--chalk-dim)'}}> vs </span>
              <span style={{color:'var(--chalk-dim)'}}>#{game.home_seed}</span> {game.home_team}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span className="admin-score-label">SPREAD</span>
              <input type="number" step="0.5"
                style={{width:72,background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',padding:'5px 8px',fontFamily:'DM Mono,monospace',fontSize:13,outline:'none'}}
                value={localSpreads[game.id]??""} onChange={e=>setSpread(game.id,e.target.value)} />
            </div>
            <div className="admin-score-inputs">
              <div><div className="admin-score-label">{game.away_team?.split(' ').pop()}</div>
                <input type="number" value={localScores[game.id]?.away??""} onChange={e=>setScore(game.id,'away',e.target.value)} placeholder="--" /></div>
              <span style={{color:'var(--chalk-dim)',fontFamily:'DM Mono,monospace'}}>—</span>
              <div><div className="admin-score-label">{game.home_team?.split(' ').pop()}</div>
                <input type="number" value={localScores[game.id]?.home??""} onChange={e=>setScore(game.id,'home',e.target.value)} placeholder="--" /></div>
            </div>
            <div style={{display:'flex',gap:6,marginLeft:'auto',alignItems:'center'}}>
              {game.status==="final" && <span className="tag tag-final">FINAL</span>}
              <button className="btn btn-ghost btn-sm" style={{fontSize:11,
                color:game.locked_override===true?'var(--red)':game.locked_override===false?'var(--green)':isGameLocked(game)?'var(--red)':'var(--chalk-dim)'}}
                onClick={()=>toggleLock(game)}>
                {game.locked_override===true?'🔒 FORCED LOCK':game.locked_override===false?'🔓 FORCED OPEN':isGameLocked(game)?'🔒 AUTO-LOCKED':'🟢 AUTO-OPEN'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--red)',borderColor:'rgba(231,76,60,0.3)',fontSize:11}} onClick={()=>deleteGame(game.id)}>✕</button>
            </div>
          </div>
        ))}

        {games.length>0 && (
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button className="btn btn-kelly btn-sm" onClick={saveSpreads}>SAVE SPREADS</button>
            <button className="btn btn-green btn-sm" onClick={saveScores}>SAVE SCORES</button>
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="admin-section">
        <div className="admin-title">ROUND CONTROLS — {ROUNDS[adminRound-1]?.name}</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:12}}>
          {rsVal==="open"   && <button className="btn btn-red"   onClick={lockRound}>🔒 LOCK ROUND {adminRound} — CLOSE PICKS</button>}
          {rsVal==="locked" && <button className="btn btn-ghost" onClick={unlockRound}>🔓 RE-OPEN PICKS</button>}
          {rsVal!=="open"   && adminRound<6 && <button className="btn btn-green" onClick={advanceRound}>▶ SETTLE &amp; ADVANCE TO {ROUNDS[adminRound]?.name?.toUpperCase()}</button>}
          {rsVal!=="open"   && adminRound===6 && <button className="btn btn-green" onClick={closeChampionship}>🏆 CLOSE CHAMPIONSHIP &amp; FINALIZE STANDINGS</button>}
        </div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>
          Viewing R{adminRound} · Active R{activeRound} · {rsVal.toUpperCase()} · {games.filter(g=>g.status==='final').length}/{games.length} games final
        </div>
      </div>

      <div className="divider" />
      <AdminPlayers appData={appData} onRefresh={onRefresh} />
    </div>
  );
}

// ============================================================
// ADMIN PLAYERS
// ============================================================
function AdminPlayers({ appData, onRefresh }) {
  const { currentRound, startingPoints: globalSP, registrationLocked } = appData;
  const [players, setPlayers] = useState([]);
  const [editPts, setEditPts] = useState({});
  const [editPwd, setEditPwd] = useState({});
  const [startPts, setStartPts] = useState(globalSP.toString());
  const [regLocked, setRegLocked] = useState(!!registrationLocked);
  const [msg, setMsg] = useState("");

  useEffect(() => { DB.getAllUsers().then(u=>setPlayers(u.filter(x=>!x.is_admin))); }, []);
  useEffect(() => { setRegLocked(!!registrationLocked); }, [registrationLocked]);

  const flash = (t) => { setMsg(t); setTimeout(()=>setMsg(""),3000); };

  const toggleRegistration = async () => {
    const next = !regLocked;
    await DB.setSetting('registration_locked', next ? 'true' : 'false');
    setRegLocked(next);
    flash(next ? '🔒 Registration locked — no new sign-ups allowed.' : '🔓 Registration open — players can sign up.');
    onRefresh();
  };

  const saveStartingPoints = async () => {
    const val = parseInt(startPts);
    if (!val||val<1) return flash("Enter a valid number.");
    await DB.setSetting('starting_points', val.toString());
    flash(`Starting points set to ${val}.`); onRefresh();
  };

  const overridePoints = async (email) => {
    const val = parseInt(editPts[email]);
    if (isNaN(val)||val<0) return flash("Enter a valid point value.");
    const u = players.find(p=>p.email===email);
    const rounds = {...(u.rounds||{}), [currentRound]:val};
    await DB.updateUser(email, { rounds });
    setPlayers(prev=>prev.map(p=>p.email===email?{...p,rounds}:p));
    flash(`Updated ${u.name} to ${val} pts.`); onRefresh();
  };

  const resetPassword = async (email) => {
    const newPwd = editPwd[email]?.trim();
    if (!newPwd||newPwd.length<4) return flash("Password must be at least 4 characters.");
    const u = players.find(p=>p.email===email);
    await DB.updateUser(email, { password: btoa(newPwd) });
    setEditPwd(prev=>({...prev,[email]:""}));
    flash(`Password reset for ${u.name}.`);
  };

  const togglePaid = async (email) => {
    const u = players.find(p=>p.email===email);
    const paid = !u.paid;
    const error = await DB.updateUser(email, { paid });
    if (error) { flash(`Error updating paid status: ${error.message}`); return; }
    setPlayers(prev=>prev.map(p=>p.email===email?{...p,paid}:p));
    // Also update session if this player is logged in
    const session = sessionStorage.getItem('kelly_session');
    if (session) {
      const s = JSON.parse(session);
      if (s.email === email) sessionStorage.setItem('kelly_session', JSON.stringify({...s, paid}));
    }
    flash(`${u.name} marked as ${paid?'PAID ✓':'UNPAID'}.`);
  };

  const deletePlayer = async (email) => {
    if (!window.confirm(`Delete ${players.find(p=>p.email===email)?.name}? This cannot be undone.`)) return;
    await supabase.from('picks').delete().eq('email', email);
    await supabase.from('users').delete().eq('email', email);
    setPlayers(prev => prev.filter(p => p.email !== email));
    flash("Player deleted.");
  };

  const resetAllData = async () => {
    if (!window.confirm("⚠️ RESET ALL DATA?\n\nThis will:\n• Delete ALL picks\n• Delete ALL games\n• Reset ALL player points to current starting value\n• Clear tournament complete status\n• Reset to Round 1\n\nThis cannot be undone. Are you sure?")) return;
    flash("Resetting... please wait.");
    await DB.resetAllGameData();
    // Reload fresh player data from DB
    const freshPlayers = await DB.getAllUsers();
    setPlayers(freshPlayers.filter(x=>!x.is_admin));
    // Clear any stale player sessions so their points update on next load
    sessionStorage.removeItem('kelly_session');
    flash(`✓ Reset complete. All players start with ${globalSP} pts. Round reset to 1.`);
    onRefresh();
  };

  return (
    <div className="admin-section">
      <div className="admin-title">GAME SETTINGS</div>
      {msg && <div className="success-msg" style={{marginBottom:12}}>{msg}</div>}
      <div style={{background:'rgba(77,189,92,0.05)',border:'1px solid rgba(77,189,92,0.15)',padding:16,marginBottom:16}}>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',letterSpacing:1,marginBottom:8}}>STARTING POINTS FOR THE GAME</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <input type="number" min="1"
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',padding:'8px 12px',fontFamily:'DM Mono,monospace',fontSize:18,width:120,outline:'none'}}
            value={startPts} onChange={e=>setStartPts(e.target.value)} />
          <button className="btn btn-kelly btn-sm" onClick={saveStartingPoints}>SAVE</button>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>Currently: <strong style={{color:'var(--gold)'}}>{globalSP} pts</strong></span>
        </div>
      </div>
      <div style={{background: regLocked ? 'rgba(231,76,60,0.06)' : 'rgba(77,189,92,0.05)', border: regLocked ? '1px solid rgba(231,76,60,0.3)' : '1px solid rgba(77,189,92,0.15)', padding:16, marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
        <div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',letterSpacing:1,marginBottom:4}}>PLAYER REGISTRATION</div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:12, color: regLocked ? 'var(--red)' : 'var(--kelly)'}}>
            {regLocked ? '🔒 LOCKED — New sign-ups are disabled' : '🔓 OPEN — Players can create accounts'}
          </div>
        </div>
        <button onClick={toggleRegistration} className={`btn btn-sm ${regLocked ? 'btn-kelly' : 'btn-red'}`}>
          {regLocked ? '🔓 OPEN REGISTRATION' : '🔒 LOCK REGISTRATION'}
        </button>
      </div>

      <div className="admin-title">REGISTERED PLAYERS ({players.length})</div>
      {players.length===0 && <div className="empty-state">No players yet.</div>}
      {players.map(u => {
        const pts = u.rounds?.[currentRound]??0;
        return (
          <div key={u.email} className="admin-game-row" style={{flexWrap:'wrap',gap:10,alignItems:'center'}}>
            <div style={{flex:1,minWidth:140}}>
              <div style={{fontWeight:600,fontSize:15}}>{u.name}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)'}}>{u.email}</div>
            </div>
            <span className="tag tag-open" style={{fontSize:13,padding:'4px 12px'}}>{pts} PTS</span>
            {/* Paid status */}
            <button onClick={()=>togglePaid(u.email)} style={{
              fontFamily:'DM Mono,monospace', fontSize:11, padding:'4px 12px', cursor:'pointer',
              background: u.paid ? 'rgba(77,189,92,0.15)' : 'rgba(231,76,60,0.15)',
              border: u.paid ? '1px solid rgba(77,189,92,0.4)' : '1px solid rgba(231,76,60,0.4)',
              color: u.paid ? 'var(--kelly)' : 'var(--red)',
              letterSpacing:1
            }}>
              {u.paid ? '✓ PAID' : '✕ UNPAID'}
            </button>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)'}}>PTS OVERRIDE</div>
              <input type="number" min="0" placeholder={pts.toString()}
                style={{background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:13,width:80,outline:'none'}}
                value={editPts[u.email]??""} onChange={e=>setEditPts(prev=>({...prev,[u.email]:e.target.value}))} />
              <button className="btn btn-kelly btn-sm" style={{opacity:editPts[u.email]?1:0.4}} onClick={()=>overridePoints(u.email)}>SET</button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)'}}>NEW PASSWORD</div>
              <input type="text" placeholder="new password"
                style={{background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',padding:'5px 10px',fontFamily:'DM Mono,monospace',fontSize:13,width:130,outline:'none'}}
                value={editPwd[u.email]??""} onChange={e=>setEditPwd(prev=>({...prev,[u.email]:e.target.value}))} />
              <button className="btn btn-ghost btn-sm" style={{opacity:editPwd[u.email]?1:0.4,fontSize:11}} onClick={()=>resetPassword(u.email)}>RESET</button>
            </div>
            <button className="btn btn-ghost btn-sm" style={{color:'var(--red)',borderColor:'rgba(231,76,60,0.3)',fontSize:11,marginLeft:'auto'}} onClick={()=>deletePlayer(u.email)}>✕ DELETE</button>
          </div>
        );
      })}

      {/* ── Danger Zone ── */}
      <div className="divider" />
      <div style={{background:'rgba(231,76,60,0.05)',border:'1px solid rgba(231,76,60,0.2)',padding:20,marginTop:8}}>
        <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:20,letterSpacing:2,color:'var(--red)',marginBottom:8}}>DANGER ZONE</div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',marginBottom:14,lineHeight:1.6}}>
          Wipe all picks, games, notifications, and reset player points before a real game or fresh test run.
          Player accounts are kept. Points reset to current starting value. Round resets to 1.
        </div>
        <button className="btn btn-red" onClick={resetAllData}>🗑 RESET ALL PICKS, GAMES &amp; POINTS</button>
      </div>
    </div>
  );
}

// ============================================================
// ROUND TRACKER VIEW (admin only)
// ============================================================
function RoundTrackerView({ appData }) {
  const { currentRound, startingPoints: globalSP, roundStatus } = appData;
  const [players, setPlayers] = useState([]);
  const [picks,   setPicks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [currentRound]);

  const load = async () => {
    setLoading(true);
    const [allUsers, allPicks] = await Promise.all([DB.getAllUsers(), DB.getAllPicks()]);
    setPlayers(allUsers.filter(u=>!u.is_admin));
    setPicks(allPicks.filter(p=>p.round===currentRound));
    setLoading(false);
  };

  const rsVal = roundStatus[currentRound] || "open";
  const roundInfo = ROUNDS[currentRound-1];

  const rows = players.map(u => {
    const startPts   = u.rounds?.[currentRound] ?? globalSP;
    const myPicks    = picks.filter(p=>p.email===u.email);
    const wagered    = myPicks.reduce((s,p)=>s+(p.wager||0), 0);
    const minRequired = Math.ceil(startPts * 0.5);
    const pct        = startPts > 0 ? Math.round((wagered / startPts) * 100) : 0;
    const metMin     = wagered >= minRequired;
    return { name:u.name, email:u.email, startPts, wagered, minRequired, pct, metMin, pickCount:myPicks.length };
  }).sort((a,b) => b.pct - a.pct);

  const totalNotMet = rows.filter(r=>!r.metMin).length;

  return (
    <div>
      <div className="round-banner">
        <div>
          <div className="round-name">ROUND TRACKER</div>
          <div className="round-dates">{roundInfo?.name} · {roundInfo?.dates}</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className={`round-status status-${rsVal}`}>
            {rsVal==='open'?'● PICKS OPEN':rsVal==='locked'?'■ PICKS LOCKED':'✓ COMPLETE'}
          </div>
          {totalNotMet > 0 && rsVal === 'open' && (
            <span style={{fontFamily:'DM Mono,monospace',fontSize:11,background:'rgba(231,76,60,0.15)',
              border:'1px solid rgba(231,76,60,0.4)',color:'var(--red)',padding:'4px 10px'}}>
              ⚠ {totalNotMet} player{totalNotMet>1?'s':''} below 50%
            </span>
          )}
        </div>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && (
        <div style={{background:'var(--hardwood)', border:'1px solid var(--line)'}}>
          {/* Header */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 90px 90px 90px 90px 120px 80px',
            padding:'8px 20px', borderBottom:'1px solid var(--line)',
            fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)', letterSpacing:1}}>
            <span>PLAYER</span>
            <span style={{textAlign:'right'}}>START PTS</span>
            <span style={{textAlign:'right'}}>WAGERED</span>
            <span style={{textAlign:'right'}}>MIN REQ</span>
            <span style={{textAlign:'right'}}>REMAINING</span>
            <span style={{textAlign:'center'}}>% IN ACTION</span>
            <span style={{textAlign:'right'}}>STATUS</span>
          </div>

          {rows.length === 0 && <div className="empty-state">No players yet.</div>}
          {rows.map((row, i) => (
            <div key={row.email} style={{
              display:'grid', gridTemplateColumns:'1fr 90px 90px 90px 90px 120px 80px',
              padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.03)',
              alignItems:'center',
              background: !row.metMin && rsVal==='open' ? 'rgba(231,76,60,0.05)' : i%2===0?'transparent':'rgba(255,255,255,0.02)',
              borderLeft: !row.metMin && rsVal==='open' ? '3px solid var(--red)' : '3px solid transparent'
            }}>
              <div>
                <div style={{fontWeight:600, fontSize:15}}>{row.name}</div>
                <div style={{fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)'}}>{row.pickCount} pick{row.pickCount!==1?'s':''}</div>
              </div>
              <span style={{textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:13, color:'var(--gold)'}}>{row.startPts}</span>
              <span style={{textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:13, color:'var(--kelly)'}}>{row.wagered}</span>
              <span style={{textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:13, color:'var(--chalk-dim)'}}>{row.minRequired}</span>
              <span style={{textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:13,
                color: row.startPts - row.wagered >= 0 ? 'var(--chalk)' : 'var(--red)'}}>
                {row.startPts - row.wagered}
              </span>

              {/* Progress bar */}
              <div style={{padding:'0 8px'}}>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <div style={{flex:1, height:8, background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden'}}>
                    <div style={{
                      height:'100%', borderRadius:4,
                      width:`${Math.min(row.pct, 100)}%`,
                      background: row.metMin ? 'var(--kelly)' : row.pct >= 30 ? 'var(--gold)' : 'var(--red)',
                      transition:'width 0.3s'
                    }} />
                  </div>
                  <span style={{fontFamily:'DM Mono,monospace', fontSize:11,
                    color: row.metMin ? 'var(--kelly)' : 'var(--red)',
                    fontWeight: !row.metMin ? 700 : 400,
                    minWidth:36, textAlign:'right'}}>
                    {row.pct}%
                  </span>
                </div>
                {/* 50% marker line label */}
                <div style={{fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--chalk-dim)', textAlign:'center', marginTop:2}}>
                  50% min
                </div>
              </div>

              <div style={{textAlign:'right'}}>
                {row.metMin
                  ? <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--kelly)',background:'rgba(77,189,92,0.1)',border:'1px solid rgba(77,189,92,0.3)',padding:'3px 8px'}}>✓ MET</span>
                  : rsVal==='open'
                    ? <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--red)',background:'rgba(231,76,60,0.1)',border:'1px solid rgba(231,76,60,0.3)',padding:'3px 8px',fontWeight:700}}>BELOW</span>
                    : <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',padding:'3px 8px'}}>—</span>
                }
              </div>
            </div>
          ))}

          {/* Summary footer */}
          {rows.length > 0 && (
            <div style={{padding:'12px 20px', borderTop:'1px solid var(--line)',
              fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--chalk-dim)',
              display:'flex', gap:24}}>
              <span>Total wagered: <strong style={{color:'var(--kelly)'}}>{rows.reduce((s,r)=>s+r.wagered,0)} pts</strong></span>
              <span>Met 50%: <strong style={{color:'var(--kelly)'}}>{rows.filter(r=>r.metMin).length}/{rows.length}</strong></span>
              {totalNotMet > 0 && rsVal==='open' && (
                <span style={{color:'var(--red)'}}>⚠ {totalNotMet} still need to wager more</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PLAYER WAGER LOG (completed picks only — no pending)
// ============================================================
function PlayerWagerLogView() {
  const [allPicks, setAllPicks] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [users, setUsers]       = useState([]);
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [filterRound,  setFilterRound]  = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([DB.getAllPicks(), DB.getGames(), DB.getAllUsers()]).then(([p,g,u]) => {
      setAllPicks(p); setAllGames(g); setUsers(u.filter(x=>!x.is_admin)); setLoading(false);
    });
  }, []);

  const wagers = allPicks.map(pick => {
    const game = allGames.find(g=>g.id===pick.game_id)||pick.games;
    const u    = users.find(u=>u.email===pick.email);
    if (!game||!u) return null;
    if (game.status !== "final") return null; // hide pending picks
    const {won,push} = calcResult(game, pick.side);
    const rawSpread = Number(game.spread);
    const pickedAway = pick.side === 'away';
    const pickedSpread = pickedAway ? rawSpread : -rawSpread;
    const spreadLabel = pickedSpread > 0 ? `+${pickedSpread}` : `${pickedSpread}`;
    const isUnderdog = pickedSpread > 0;
    return { email:pick.email, name:u.name, round:pick.round,
      game:`${game.away_team} vs ${game.home_team}`,
      side:pickedAway?game.away_team:game.home_team,
      spreadLabel, isUnderdog, wager:pick.wager,
      result: push?'PUSH':won?'WIN':'LOSS' };
  }).filter(Boolean);

  const filtered = wagers
    .filter(w=>filterPlayer==="all"||w.email===filterPlayer)
    .filter(w=>filterRound==="all"||w.round===parseInt(filterRound))
    .sort((a,b)=>a.round-b.round||a.name.localeCompare(b.name));

  const wins   = filtered.filter(w=>w.result==='WIN').length;
  const losses = filtered.filter(w=>w.result==='LOSS').length;

  return (
    <div>
      <div className="round-banner">
        <div className="round-name">WAGER LOG</div>
        <div className="round-dates">Completed picks from all rounds</div>
      </div>
      <div style={{display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'flex-end'}}>
        <div className="field" style={{marginBottom:0}}><label>FILTER BY PLAYER</label>
          <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)}>
            <option value="all">All Players</option>
            {users.map(u=><option key={u.email} value={u.email}>{u.name}</option>)}
          </select>
        </div>
        <div className="field" style={{marginBottom:0}}><label>FILTER BY ROUND</label>
          <select value={filterRound} onChange={e=>setFilterRound(e.target.value)}>
            <option value="all">All Rounds</option>
            {ROUNDS.map(r=><option key={r.num} value={r.num}>{r.name}</option>)}
          </select>
        </div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',paddingBottom:8}}>
          {filtered.length} completed picks · {wins}W {losses}L
        </div>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && (
        <div style={{background:'var(--hardwood)', border:'1px solid var(--line)'}}>
          <div style={{display:'grid', gridTemplateColumns:'120px 100px 1fr 120px 70px 70px 70px',
            padding:'8px 16px', borderBottom:'1px solid var(--line)',
            fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)', letterSpacing:1}}>
            <span>PLAYER</span><span>ROUND</span><span>GAME</span><span>PICKED</span>
            <span style={{textAlign:'right'}}>SPREAD</span>
            <span style={{textAlign:'right'}}>WAGER</span>
            <span style={{textAlign:'right'}}>RESULT</span>
          </div>
          {filtered.length===0 && <div className="empty-state">No completed picks yet.</div>}
          {filtered.map((w,i) => (
            <div key={i} style={{display:'grid', gridTemplateColumns:'120px 100px 1fr 120px 70px 70px 70px',
              padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.03)',
              fontSize:13, alignItems:'center',
              background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
              <span style={{fontWeight:600}}>{w.name}</span>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>
                {ROUNDS[w.round-1]?.name?.replace('Round of ','R')||`R${w.round}`}
              </span>
              <span style={{color:'var(--chalk-dim)',fontSize:12,fontFamily:'DM Mono,monospace'}}>{w.game}</span>
              <span style={{color:'var(--kelly)',fontSize:12,fontWeight:600}}>{w.side}</span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,
                color:w.isUnderdog?'#5b9bd5':'var(--gold)',fontWeight:w.isUnderdog?700:400}}>
                {w.spreadLabel}
              </span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:13}}>{w.wager}</span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:11,
                color:w.result==='WIN'?'var(--green)':w.result==='LOSS'?'var(--red)':'var(--gold)'}}>
                {w.result}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// WAGER LOG (admin)
// ============================================================
function WagerLogView() {
  const [allPicks, setAllPicks] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [users, setUsers]       = useState([]);
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [filterRound,  setFilterRound]  = useState("all");
  const [sortBy, setSortBy]     = useState("round_player"); // round_player | player_round | wager_desc | wager_asc | result | submitted
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([DB.getAllPicks(), DB.getGames(), DB.getAllUsers()]).then(([p,g,u]) => {
      setAllPicks(p); setAllGames(g); setUsers(u.filter(x=>!x.is_admin)); setLoading(false);
    });
  }, []);

  const wagers = allPicks.map(pick => {
    const game = allGames.find(g=>g.id===pick.game_id)||pick.games;
    const u    = users.find(u=>u.email===pick.email);
    if (!game||!u) return null;
    const {won,push} = game.status==="final" ? calcResult(game,pick.side) : {won:false,push:false};
    const rawSpread = Number(game.spread);
    const pickedAway = pick.side === 'away';
    const pickedSpread = pickedAway ? rawSpread : -rawSpread;
    const spreadLabel = pickedSpread > 0 ? `+${pickedSpread}` : `${pickedSpread}`;
    const isUnderdog = pickedSpread > 0;
    return { email:pick.email, name:u.name, round:pick.round,
      game:`${game.away_team} vs ${game.home_team}`,
      side:pickedAway?game.away_team:game.home_team,
      spreadLabel, isUnderdog,
      wager:pick.wager,
      submittedAt: pick.created_at,
      result:game.status==="final"?(push?'PUSH':won?'WIN':'LOSS'):'PENDING' };
  }).filter(Boolean);

  const sortFns = {
    round_player:  (a,b) => a.round-b.round  || a.name.localeCompare(b.name),
    player_round:  (a,b) => a.name.localeCompare(b.name) || a.round-b.round,
    wager_desc:    (a,b) => b.wager-a.wager,
    wager_asc:     (a,b) => a.wager-b.wager,
    result:        (a,b) => a.result.localeCompare(b.result),
    submitted:     (a,b) => new Date(a.submittedAt)-new Date(b.submittedAt),
  };

  const filtered = wagers
    .filter(w=>filterPlayer==="all"||w.email===filterPlayer)
    .filter(w=>filterRound==="all"||w.round===parseInt(filterRound))
    .sort(sortFns[sortBy] || sortFns.round_player);

  const totalWagered = filtered.reduce((s,w)=>s+w.wager,0);
  const wins   = filtered.filter(w=>w.result==='WIN').length;
  const losses = filtered.filter(w=>w.result==='LOSS').length;

  return (
    <div>
      <div className="round-banner"><div className="round-name">WAGER LOG</div><div className="round-dates">Full audit of all picks</div></div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'flex-end'}}>
        <div className="field" style={{marginBottom:0}}><label>FILTER BY PLAYER</label>
          <select value={filterPlayer} onChange={e=>setFilterPlayer(e.target.value)}>
            <option value="all">All Players</option>
            {users.map(u=><option key={u.email} value={u.email}>{u.name}</option>)}
          </select>
        </div>
        <div className="field" style={{marginBottom:0}}><label>FILTER BY ROUND</label>
          <select value={filterRound} onChange={e=>setFilterRound(e.target.value)}>
            <option value="all">All Rounds</option>
            {ROUNDS.map(r=><option key={r.num} value={r.num}>{r.name}</option>)}
          </select>
        </div>
        <div className="field" style={{marginBottom:0}}><label>SORT BY</label>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="round_player">Round → Player</option>
            <option value="player_round">Player → Round</option>
            <option value="wager_desc">Wager (Highest First)</option>
            <option value="wager_asc">Wager (Lowest First)</option>
            <option value="result">Result (W/L/Push)</option>
            <option value="submitted">Time Submitted</option>
          </select>
        </div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',paddingBottom:8}}>
          {filtered.length} picks · {totalWagered} pts wagered · {wins}W {losses}L
        </div>
      </div>
      {loading && <div className="empty-state">Loading wagers...</div>}
      {!loading && (
        <div style={{background:'var(--hardwood)',border:'1px solid var(--line)'}}>
          <div style={{display:'grid',gridTemplateColumns:'110px 90px 1fr 110px 60px 60px 90px 70px',padding:'8px 16px',borderBottom:'1px solid var(--line)',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',letterSpacing:1}}>
            <span>PLAYER</span><span>ROUND</span><span>GAME</span><span>PICKED</span>
            <span style={{textAlign:'right'}}>SPREAD</span><span style={{textAlign:'right'}}>WAGER</span>
            <span style={{textAlign:'right'}}>SUBMITTED</span><span style={{textAlign:'right'}}>RESULT</span>
          </div>
          {filtered.length===0 && <div className="empty-state">No wagers match your filters.</div>}
          {filtered.map((w,i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'110px 90px 1fr 110px 60px 60px 90px 70px',padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.03)',fontSize:13,alignItems:'center',background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
              <span style={{fontWeight:600}}>{w.name}</span>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>{ROUNDS[w.round-1]?.name?.replace('Round of ','R')||`R${w.round}`}</span>
              <span style={{color:'var(--chalk-dim)',fontSize:12,fontFamily:'DM Mono,monospace'}}>{w.game}</span>
              <span style={{color:'var(--kelly)',fontSize:12,fontWeight:600}}>{w.side}</span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:w.isUnderdog?'#5b9bd5':'var(--gold)',fontWeight:w.isUnderdog?700:400}}>{w.spreadLabel}</span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:13}}>{w.wager}</span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)'}}>{formatCT(w.submittedAt)}</span>
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:11,color:w.result==='WIN'?'var(--green)':w.result==='LOSS'?'var(--red)':w.result==='PUSH'?'var(--gold)':'var(--chalk-dim)'}}>{w.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function NotificationsView({ onRefresh }) {
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [replying, setReplying] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMsg, setComposeMsg]   = useState("");
  const [composeTo, setComposeTo]     = useState("all"); // "all" or email
  const [allPlayers, setAllPlayers]   = useState([]);
  const [sending, setSending]         = useState(false);
  const [composeFlash, setComposeFlash] = useState("");

  useEffect(() => {
    DB.getNotifications().then(n=>{ setNotes(n); setLoading(false); });
    DB.getAllUsers().then(u => setAllPlayers(u.filter(x=>!x.is_admin)));
  }, []);

  const markRead    = async (id) => { await DB.updateNotification(id,{read:true}); setNotes(p=>p.map(n=>n.id===id?{...n,read:true}:n)); onRefresh(); };
  const markAllRead = async ()   => { await Promise.all(notes.filter(n=>!n.read).map(n=>DB.updateNotification(n.id,{read:true}))); setNotes(p=>p.map(n=>({...n,read:true}))); onRefresh(); };
  const deleteNote  = async (id) => { await DB.deleteNotification(id); setNotes(p=>p.filter(n=>n.id!==id)); };
  const clearAll    = async ()   => { await DB.clearNotifications(); setNotes([]); };

  const sendBroadcast = async () => {
    if (!composeMsg.trim()) return;
    setSending(true);
    if (composeTo === "all") {
      // Send to every player
      await Promise.all(allPlayers.map(u => DB.addNotification({
        type: 'commissioner_reply',
        email: u.email,
        name: 'Commissioner',
        message: `📣 Commissioner: "${composeMsg.trim()}"`,
        reply_to_email: u.email,
        read: false,
      })));
      setComposeFlash(`✓ Broadcast sent to all ${allPlayers.length} players.`);
    } else {
      const u = allPlayers.find(p=>p.email===composeTo);
      await DB.addNotification({
        type: 'commissioner_reply',
        email: composeTo,
        name: 'Commissioner',
        message: `Commissioner to ${u?.name}: "${composeMsg.trim()}"`,
        reply_to_email: composeTo,
        read: false,
      });
      setComposeFlash(`✓ Message sent to ${u?.name}.`);
    }
    setComposeMsg("");
    setSending(false);
    setTimeout(()=>setComposeFlash(""), 3000);
  };

  const sendReply = async (note) => {
    if (!replyMsg.trim()) return;
    setReplying(true);
    await DB.addNotification({
      type: 'commissioner_reply',
      email: note.email,
      name: 'Commissioner',
      message: `Reply from Commissioner to ${note.name}: "${replyMsg.trim()}"`,
      reply_to_email: note.email,
      read: false,
    });
    await DB.updateNotification(note.id, { read: true, replied: true });
    setNotes(p => p.map(n => n.id===note.id ? {...n, read:true, replied:true} : n));
    setReplyingTo(null);
    setReplyMsg("");
    setReplying(false);
    onRefresh();
  };

  const unreadCount = notes.filter(n=>!n.read).length;

  const typeIcon = (type) => {
    if (type==='forgot_password') return '🔑';
    if (type==='player_message')  return '💬';
    if (type==='commissioner_reply') return '📩';
    return '📣';
  };

  const typeLabel = (type) => {
    if (type==='forgot_password')    return 'PASSWORD RESET REQUEST';
    if (type==='player_message')     return 'MESSAGE FROM PLAYER';
    if (type==='commissioner_reply') return 'COMMISSIONER REPLY (sent)';
    return 'NOTIFICATION';
  };

  const canReply = (note) => note.type === 'player_message' || note.type === 'forgot_password';

  return (
    <div>
      <div className="round-banner">
        <div><div className="round-name">NOTIFICATIONS</div><div className="round-dates">{unreadCount} unread · {notes.length} total</div></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-kelly btn-sm" onClick={()=>setShowCompose(v=>!v)}>
            {showCompose ? '✕ CANCEL' : '📣 SEND MESSAGE'}
          </button>
          {unreadCount>0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>MARK ALL READ</button>}
          {notes.length>0 && <button className="btn btn-ghost btn-sm" style={{color:'var(--red)',borderColor:'rgba(231,76,60,0.3)'}} onClick={clearAll}>CLEAR ALL</button>}
        </div>
      </div>

      {/* Compose Panel */}
      {showCompose && (
        <div style={{background:'rgba(77,189,92,0.06)', border:'1px solid rgba(77,189,92,0.25)', padding:20, marginBottom:16}}>
          <div style={{fontFamily:'Bebas Neue,sans-serif', fontSize:20, letterSpacing:2, color:'var(--kelly)', marginBottom:14}}>SEND MESSAGE TO PLAYERS</div>
          {composeFlash && <div className="success-msg" style={{marginBottom:12}}>{composeFlash}</div>}
          <div style={{display:'flex', gap:12, marginBottom:12, flexWrap:'wrap'}}>
            <div className="field" style={{marginBottom:0, flex:1, minWidth:200}}>
              <label>SEND TO</label>
              <select value={composeTo} onChange={e=>setComposeTo(e.target.value)}>
                <option value="all">📣 All Players ({allPlayers.length})</option>
                {allPlayers.map(u=><option key={u.email} value={u.email}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <textarea value={composeMsg} onChange={e=>setComposeMsg(e.target.value)}
            placeholder="Type your message to players..."
            style={{width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid var(--line)', color:'var(--chalk)',
              padding:12, fontFamily:'DM Mono,monospace', fontSize:13, outline:'none', resize:'vertical', minHeight:80, marginBottom:12}} />
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <button className="btn btn-kelly" onClick={sendBroadcast} disabled={sending||!composeMsg.trim()}>
              {sending ? 'SENDING...' : composeTo==='all' ? `📣 BROADCAST TO ALL ${allPlayers.length} PLAYERS` : '✉ SEND TO PLAYER'}
            </button>
            <span style={{fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)'}}>
              Players will see this in their ✉ MSG COMMISSIONER inbox.
            </span>
          </div>
        </div>
      )}
      {loading && <div className="empty-state">Loading...</div>}
      {!loading && notes.length===0 && <div className="empty-state">No notifications yet.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {notes.map(note => (
          <div key={note.id} style={{
            background:note.read?'var(--hardwood)':'rgba(77,189,92,0.06)',
            border:note.read?'1px solid var(--line)':'1px solid rgba(77,189,92,0.25)',
            overflow:'hidden'
          }}>
            <div style={{padding:'16px 20px',display:'flex',alignItems:'flex-start',gap:16}}>
              <div style={{fontSize:24,flexShrink:0}}>{typeIcon(note.type)}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                  {!note.read && <span style={{background:'var(--kelly)',color:'var(--court)',fontSize:9,fontFamily:'DM Mono,monospace',padding:'2px 6px',letterSpacing:1}}>NEW</span>}
                  {note.replied && <span style={{background:'rgba(77,189,92,0.1)',color:'var(--kelly)',fontSize:9,fontFamily:'DM Mono,monospace',padding:'2px 6px',letterSpacing:1,border:'1px solid rgba(77,189,92,0.3)'}}>REPLIED</span>}
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)'}}>{typeLabel(note.type)}</span>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',marginLeft:'auto'}}>{formatCT(note.created_at)}</span>
                </div>
                <div style={{fontSize:15,color:'var(--chalk)',marginBottom:6}}>{note.message}</div>
                {note.type==='forgot_password' && (
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>
                    → Go to <strong style={{color:'var(--kelly)'}}>ADMIN → Registered Players</strong> to reset their password.
                  </div>
                )}
                {note.email && note.type !== 'commissioner_reply' && (
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',marginTop:4}}>
                    From: <strong style={{color:'var(--chalk)'}}>{note.name}</strong> · {note.email}
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0,flexDirection:'column',alignItems:'flex-end'}}>
                {canReply(note) && (
                  <button className="btn btn-kelly btn-sm" style={{fontSize:10}}
                    onClick={()=>{ setReplyingTo(replyingTo===note.id?null:note.id); setReplyMsg(""); }}>
                    {replyingTo===note.id ? '✕ CANCEL' : '↩ REPLY'}
                  </button>
                )}
                {!note.read && <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={()=>markRead(note.id)}>MARK READ</button>}
                <button className="btn btn-ghost btn-sm" style={{fontSize:10,color:'var(--red)',borderColor:'rgba(231,76,60,0.3)'}} onClick={()=>deleteNote(note.id)}>✕</button>
              </div>
            </div>

            {/* Reply panel */}
            {replyingTo === note.id && (
              <div style={{borderTop:'1px solid var(--line)',padding:'16px 20px',background:'rgba(77,189,92,0.04)'}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--kelly)',marginBottom:8,letterSpacing:1}}>
                  ↩ REPLY TO {note.name?.toUpperCase()}
                </div>
                <textarea value={replyMsg} onChange={e=>setReplyMsg(e.target.value)}
                  placeholder={`Type your reply to ${note.name}...`}
                  style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',
                    padding:12,fontFamily:'DM Mono,monospace',fontSize:13,outline:'none',resize:'vertical',minHeight:80,marginBottom:10}} />
                <button className="btn btn-kelly btn-sm" onClick={()=>sendReply(note)} disabled={replying||!replyMsg.trim()}>
                  {replying?'SENDING...':'SEND REPLY TO PLAYER'}
                </button>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',marginTop:8}}>
                  The player will see your reply in their notifications.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// RULES VIEW
// ============================================================
function RulesView({ user, appData }) {
  const { startingPoints } = appData;

  const Rule = ({ num, title, children }) => (
    <div style={{background:'var(--hardwood)', border:'1px solid var(--line)', marginBottom:12, overflow:'hidden'}}>
      <div style={{display:'flex', alignItems:'center', gap:16, padding:'14px 20px', borderBottom:'1px solid var(--line)'}}>
        <span style={{fontFamily:'Bebas Neue,sans-serif', fontSize:36, color:'var(--kelly)', lineHeight:1, minWidth:32}}>{num}</span>
        <span style={{fontFamily:'Bebas Neue,sans-serif', fontSize:20, letterSpacing:2, color:'var(--chalk)'}}>{title}</span>
      </div>
      <div style={{padding:'14px 20px', fontFamily:'DM Mono,monospace', fontSize:12, color:'var(--chalk-dim)', lineHeight:1.8}}>
        {children}
      </div>
    </div>
  );

  const Highlight = ({ children }) => (
    <span style={{color:'var(--kelly)', fontWeight:700}}>{children}</span>
  );

  const Gold = ({ children }) => (
    <span style={{color:'var(--gold)', fontWeight:700}}>{children}</span>
  );

  const Red = ({ children }) => (
    <span style={{color:'var(--red)', fontWeight:700}}>{children}</span>
  );

  return (
    <div>
      <div className="round-banner">
        <div>
          <div className="round-name">RULES OF THE KELLY GAME</div>
          <div className="round-dates">NCAA Tournament · Spread Game</div>
        </div>
        {user.paid !== true && (
          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,background:'rgba(231,76,60,0.15)',
            border:'1px solid rgba(231,76,60,0.4)',color:'var(--red)',padding:'6px 14px'}}>
            💳 ENTRY FEE OUTSTANDING
          </span>
        )}
        {user.paid === true && (
          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,background:'rgba(77,189,92,0.15)',
            border:'1px solid rgba(77,189,92,0.4)',color:'var(--kelly)',padding:'6px 14px'}}>
            ✓ ENTRY FEE PAID
          </span>
        )}
      </div>

      {/* Quick summary card */}
      <div style={{background:'rgba(77,189,92,0.06)', border:'1px solid rgba(77,189,92,0.2)',
        padding:20, marginBottom:24, fontFamily:'DM Mono,monospace', fontSize:12, color:'var(--chalk-dim)', lineHeight:1.9}}>
        <div style={{fontFamily:'Bebas Neue,sans-serif', fontSize:18, letterSpacing:2, color:'var(--kelly)', marginBottom:12}}>THE SHORT VERSION</div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {[
            <span>1. You start with <Gold>{startingPoints} points</Gold> — your bankroll for the game.</span>,
            <span>2. Each round, pick teams against the spread and wager your points.</span>,
            <span>3. <Highlight>Win a pick</Highlight> → earn points equal to your wager. <Red>Lose</Red> → lose them.</span>,
            <span>4. Your <Gold>winnings carry forward</Gold> — your point total from this round becomes your starting balance for the next round.</span>,
            <span>5. You must wager at least <Red>50% of your points</Red> each round or forfeit the remainder.</span>,
            <span>6. The player with the <Highlight>most points</Highlight> after the Championship wins. 🏆</span>,
          ].map((item, i) => (
            <div key={i} style={{display:'flex', gap:8}}>{item}</div>
          ))}
        </div>
      </div>

      <Rule num="1" title="STARTING POINTS">
        Every player starts the tournament with <Gold>{startingPoints} points</Gold>. This is your bankroll for the entire game.
        There is no buy-in of points between rounds — you play with what you earn.
      </Rule>

      <Rule num="2" title="HOW ROUNDS WORK">
        The tournament is played across <Highlight>6 rounds</Highlight>: Round of 64, Round of 32, Sweet 16, Elite Eight, Final Four, and the Championship.
        Each round has its own set of games with point spreads. You place your wagers at the start of each round and results are tallied once all games are final.
      </Rule>

      <Rule num="3" title="PICKING AGAINST THE SPREAD">
        Every game has a <Gold>point spread</Gold>. The favorite must win by more than the spread — the underdog just needs to keep it close (or win outright).<br/><br/>
        Example: If Duke is <Gold>-8.5</Gold>, Duke must win by 9 or more for "Duke -8.5" to cover.
        If you picked <Highlight>Vermont +8.5</Highlight>, Vermont just needs to lose by 8 or fewer — or win.
      </Rule>

      <Rule num="4" title="PLACING WAGERS">
        You can bet on <Highlight>as many or as few games</Highlight> as you want each round, as long as:
        <br/>• Your total wagers do <Red>not exceed</Red> your starting points for the round
        <br/>• You wager at least <Red>50% of your starting points</Red> across all games that round
        <br/><br/>
        You choose how to spread your points — go big on a few games, or spread across many. Strategy is everything.
      </Rule>

      <Rule num="5" title="THE 50% RULE — CRITICAL">
        <Red style={{fontSize:13}}>You MUST wager at least 50% of your points each round.</Red>
        <br/><br/>
        If you start a round with <Gold>200 points</Gold>, you must wager at least <Gold>100 points</Gold> across your picks before the round locks.
        <br/><br/>
        <Red>If you fail to meet the 50% minimum, your unwagered balance is forfeited.</Red> The commissioner will manually adjust your total. Don't leave points on the table.
      </Rule>

      <Rule num="6" title="PICKS LOCK AT TIP-OFF">
        Once a game tips off, <Red>picks for that game are locked</Red> — no changes allowed. Make sure you get your picks in early.
        The commissioner can also lock the entire round manually ahead of the first tip.
      </Rule>

      <Rule num="7" title="WINNING & LOSING POINTS">
        <Highlight>Win a pick:</Highlight> You earn the amount you wagered (e.g. bet 50 pts, win → +50 pts)<br/>
        <Red>Lose a pick:</Red> You lose the amount you wagered (e.g. bet 50 pts, lose → -50 pts)<br/>
        <Gold>Push (exactly on the spread):</Gold> Your wager is returned — no gain, no loss
      </Rule>

      <Rule num="8" title="BETWEEN ROUNDS">
        After all games in a round are final, the commissioner settles results and advances to the next round.
        Your new point total carries forward as your starting balance for the next round.
        <br/><br/>
        Check the <Highlight>Leaderboard</Highlight> after each round to see where you stand and plan your strategy.
      </Rule>

      <Rule num="9" title="WINNING THE KELLY GAME">
        The player with the <Highlight>most points</Highlight> at the end of the Championship game wins.
        In the event of a tie, the tiebreaker is the most wins across all rounds.
      </Rule>

      <Rule num="10" title="COMMISSIONER'S DISCRETION">
        The commissioner has final say on all disputes, technical issues, and scoring corrections.
        If you believe a result was scored incorrectly, or have any questions, use the{' '}
        <Highlight>✉ MSG COMMISSIONER</Highlight> button in the top right corner of your screen to send a direct message.
        The commissioner will be notified immediately.
        Be a good sport — it's all for fun. 🏀
      </Rule>
    </div>
  );
}

// ============================================================
// MESSAGE COMMISSIONER BUTTON
// ============================================================
function MessageCommissionerBtn({ user }) {
  const [open, setOpen]       = useState(false);
  const [msg, setMsg]         = useState("");
  const [sent, setSent]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    // Load any commissioner replies for this player
    DB.getNotifications().then(notes => {
      const mine = notes.filter(n => n.type === 'commissioner_reply' && n.reply_to_email === user.email);
      setReplies(mine);
    });
  }, [open]);

  const unreadReplies = replies.filter(r => !r.read).length;

  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    await DB.addNotification({
      type: 'player_message',
      email: user.email,
      name: user.name,
      message: `Message from ${user.name} (${user.email}): "${msg.trim()}"`,
      read: false
    });
    setSent(true); setBusy(false);
    setTimeout(() => { setSent(false); setMsg(""); }, 2500);
  };

  const markReplyRead = async (id) => {
    await DB.updateNotification(id, { read: true });
    setReplies(prev => prev.map(r => r.id===id ? {...r, read:true} : r));
  };

  return (
    <>
      <button onClick={()=>setOpen(true)} style={{
        fontFamily:'DM Mono,monospace', fontSize:10, padding:'4px 10px', cursor:'pointer',
        background: unreadReplies>0 ? 'rgba(77,189,92,0.15)' : 'rgba(77,189,92,0.08)',
        border: unreadReplies>0 ? '1px solid rgba(77,189,92,0.5)' : '1px solid rgba(77,189,92,0.25)',
        color: unreadReplies>0 ? 'var(--kelly)' : 'var(--chalk-dim)',
        letterSpacing:1, position:'relative'
      }}>
        {unreadReplies>0 ? `📩 ${unreadReplies} REPLY` : '✉ MSG COMMISSIONER'}
      </button>

      {open && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:24}}>
          <div style={{background:'var(--hardwood)',border:'1px solid var(--kelly)',padding:32,width:'100%',maxWidth:520,position:'relative',maxHeight:'80vh',overflowY:'auto'}}>
            <button onClick={()=>setOpen(false)} style={{position:'absolute',top:12,right:16,background:'none',border:'none',color:'var(--chalk-dim)',cursor:'pointer',fontSize:20}}>✕</button>
            <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:24,letterSpacing:2,color:'var(--kelly)',marginBottom:16}}>COMMISSIONER INBOX</div>

            {/* Commissioner replies */}
            {replies.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',letterSpacing:1,marginBottom:8}}>REPLIES FROM COMMISSIONER</div>
                {replies.map(r => (
                  <div key={r.id} style={{background: r.read?'rgba(255,255,255,0.03)':'rgba(77,189,92,0.08)',
                    border: r.read?'1px solid var(--line)':'1px solid rgba(77,189,92,0.3)',
                    padding:'12px 16px', marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      {!r.read && <span style={{background:'var(--kelly)',color:'var(--court)',fontSize:9,fontFamily:'DM Mono,monospace',padding:'1px 6px'}}>NEW</span>}
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',marginLeft:'auto'}}>{formatCT(r.created_at)}</span>
                    </div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--chalk)',lineHeight:1.6}}>{r.message}</div>
                    {!r.read && <button className="btn btn-ghost btn-sm" style={{fontSize:9,marginTop:8}} onClick={()=>markReplyRead(r.id)}>MARK READ</button>}
                  </div>
                ))}
                <div className="divider" />
              </div>
            )}

            {/* Send message */}
            <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',letterSpacing:1,marginBottom:8}}>SEND A MESSAGE</div>
            {sent ? (
              <div className="success-msg">✓ Message sent! The commissioner will be notified.</div>
            ) : (
              <>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',marginBottom:12}}>
                  Questions, disputes, or payment confirmation — the commissioner will reply here.
                </div>
                <textarea value={msg} onChange={e=>setMsg(e.target.value)}
                  placeholder="Type your message here..."
                  style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',padding:12,fontFamily:'DM Mono,monospace',fontSize:13,outline:'none',resize:'vertical',minHeight:80,marginBottom:12}} />
                <button className="btn btn-kelly btn-full" onClick={send} disabled={busy||!msg.trim()}>
                  {busy?'SENDING...':'SEND MESSAGE'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// FINAL STANDINGS VIEW (shown on picks page when tournament done)
// ============================================================
function FinalStandingsView({ currentEmail }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [users, allPicks, allGames, sp] = await Promise.all([DB.getAllUsers(), DB.getAllPicks(), DB.getGames(), DB.startingPoints()]);
      const built = users.filter(u=>!u.is_admin).map(u => {
        const myPicks = allPicks.filter(p=>p.email===u.email);
        const finalPts = getBestPoints(u, sp);
        let wins=0, losses=0;
        myPicks.forEach(pick => {
          const game = allGames.find(g=>g.id===pick.game_id)||pick.games;
          if (game?.status==="final") {
            const {won,push} = calcResult(game,pick.side);
            if (!push) { if(won) wins++; else losses++; }
          }
        });
        return {...u, finalPts, wins, losses};
      }).sort((a,b)=>b.finalPts-a.finalPts);
      setRows(built); setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div style={{background:'linear-gradient(135deg, rgba(240,192,64,0.15), rgba(77,189,92,0.1))',
        border:'2px solid var(--gold)', padding:'24px', marginBottom:24, textAlign:'center'}}>
        <div style={{fontFamily:'Bebas Neue,sans-serif',fontSize:48,letterSpacing:4,color:'var(--gold)'}}>🏆 TOURNAMENT COMPLETE</div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--chalk-dim)',marginTop:4}}>
          THE KELLY GAME · FINAL STANDINGS
        </div>
      </div>

      <div style={{background:'var(--hardwood)', border:'1px solid var(--line)'}}>
        <div style={{display:'grid', gridTemplateColumns:'48px 1fr 100px 60px 60px',
          padding:'8px 24px', borderBottom:'1px solid var(--line)',
          fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--chalk-dim)', letterSpacing:1}}>
          <span>#</span><span>PLAYER</span><span style={{textAlign:'right'}}>FINAL PTS</span>
          <span style={{textAlign:'right'}}>W</span><span style={{textAlign:'right'}}>L</span>
        </div>
        {loading && <div className="empty-state">Loading standings...</div>}
        {rows.map((row, i) => (
          <div key={row.email} style={{
            display:'grid', gridTemplateColumns:'48px 1fr 100px 60px 60px',
            padding:'16px 24px', borderBottom:'1px solid var(--line)',
            alignItems:'center',
            background: row.email===currentEmail ? 'rgba(77,189,92,0.08)' : 'transparent',
            borderLeft: row.email===currentEmail ? '3px solid var(--kelly)' : '3px solid transparent'
          }}>
            <span style={{fontFamily:'Bebas Neue,sans-serif', fontSize:28,
              color: i===0?'var(--gold)':i===1?'#aaa':i===2?'#cd7f32':'var(--chalk-dim)'}}>
              {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
            </span>
            <div>
              <div style={{fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, fontSize:20}}>{row.name}</div>
              {row.email===currentEmail && <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--kelly)'}}>YOU</div>}
            </div>
            <span style={{textAlign:'right', fontFamily:'Bebas Neue,sans-serif', fontSize:28,
              color: i===0?'var(--gold)':'var(--chalk)'}}>{row.finalPts}</span>
            <span style={{textAlign:'right', fontFamily:'DM Mono,monospace', color:'var(--green)'}}>{row.wins}</span>
            <span style={{textAlign:'right', fontFamily:'DM Mono,monospace', color:'var(--red)'}}>{row.losses}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
