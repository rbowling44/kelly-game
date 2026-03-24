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
  if (game.status === "final")        return true;
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

  async getUser(email)  { const {data} = await supabase.from('users').select('*').eq('email',email.toLowerCase()).single(); return data; },
  async getAllUsers()    { const {data} = await supabase.from('users').select('*'); return data||[]; },
  async upsertUser(u)   { await supabase.from('users').upsert(u); },

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
};

// ============================================================
// APP
// ============================================================
export default function App() {
  const [user, setUser]     = useState(null);
  const [tab, setTab]       = useState("picks");
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState({ currentRound:1, startingPoints:100, roundStatus:{} });
  const [unread, setUnread]   = useState(0);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
    const saved = sessionStorage.getItem('kelly_session');
    if (saved) setUser(JSON.parse(saved));
    loadAppData();
    return () => document.head.removeChild(style);
  }, []);

  const loadAppData = async () => {
    const [cr, sp, rs] = await Promise.all([DB.currentRound(), DB.startingPoints(), DB.roundStatus()]);
    setAppData({ currentRound:cr, startingPoints:sp, roundStatus:rs });
    setLoading(false);
  };

  const refreshUnread = async () => {
    const n = await DB.getNotifications();
    setUnread(n.filter(x=>!x.read).length);
  };

  useEffect(() => { if (user?.is_admin) refreshUnread(); }, [user]);

  const login  = (u) => { setUser(u); sessionStorage.setItem('kelly_session', JSON.stringify(u)); if(u.is_admin) refreshUnread(); };
  const logout = ()  => { setUser(null); sessionStorage.removeItem('kelly_session'); setTab("picks"); };

  if (loading) return <div className="loading"><span className="spinner"/>LOADING THE KELLY GAME...</div>;
  if (!user)   return <AuthScreen onLogin={login} />;

  const pts = user.rounds?.[appData.currentRound] ?? 0;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">THE KELLY<span> GAME</span></div>
        <div className="header-right">
          <span className="header-user">{user.name}</span>
          {!user.is_admin && <span className="header-points">{pts} PTS</span>}
          {user.is_admin  && <span className="tag tag-open">ADMIN</span>}
          <button className="btn btn-ghost btn-sm" onClick={logout}>LOGOUT</button>
        </div>
      </header>
      <nav className="nav">
        {!user.is_admin && <button className={`nav-tab ${tab==='picks'?'active':''}`}   onClick={()=>setTab('picks')}>MY PICKS</button>}
        <button                   className={`nav-tab ${tab==='board'?'active':''}`}    onClick={()=>setTab('board')}>LEADERBOARD</button>
        {!user.is_admin && <button className={`nav-tab ${tab==='history'?'active':''}`} onClick={()=>setTab('history')}>HISTORY</button>}
        {user.is_admin  && <button className={`nav-tab ${tab==='admin'?'active':''}`}   onClick={()=>setTab('admin')}>ADMIN</button>}
        {user.is_admin  && <button className={`nav-tab ${tab==='wagers'?'active':''}`}  onClick={()=>setTab('wagers')}>WAGER LOG</button>}
        {user.is_admin  && (
          <button className={`nav-tab ${tab==='notifications'?'active':''}`}
            onClick={()=>{ setTab('notifications'); refreshUnread(); }} style={{position:'relative'}}>
            NOTIFICATIONS
            {unread>0 && <span style={{position:'absolute',top:6,right:4,background:'var(--red)',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Mono,monospace'}}>{unread}</span>}
          </button>
        )}
      </nav>
      <main className="main">
        {tab==='picks'         && !user.is_admin && <PicksView         user={user} appData={appData} onUserUpdate={(u)=>{ setUser(u); sessionStorage.setItem('kelly_session',JSON.stringify(u)); }} />}
        {tab==='board'         &&                   <LeaderboardView   currentEmail={user.email} appData={appData} />}
        {tab==='history'       && !user.is_admin && <HistoryView       user={user} />}
        {tab==='admin'         &&  user.is_admin && <AdminView         appData={appData} onRefresh={loadAppData} />}
        {tab==='wagers'        &&  user.is_admin && <WagerLogView />}
        {tab==='notifications' &&  user.is_admin && <NotificationsView onRefresh={refreshUnread} />}
      </main>
    </div>
  );
}

// ============================================================
// AUTH
// ============================================================
function AuthScreen({ onLogin }) {
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
        {mode==="login" ? <>New player? <button onClick={()=>setMode("register")}>Create account</button></> : <>Already playing? <button onClick={()=>setMode("login")}>Sign in</button></>}
      </div>
    </div></div>
  );
}

// ============================================================
// PICKS VIEW
// ============================================================
function PicksView({ user, appData }) {
  const { currentRound, startingPoints: globalSP, roundStatus } = appData;
  const [games, setGames]   = useState([]);
  const [picks, setPicks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const startingPoints = user.rounds?.[currentRound] ?? globalSP;
  const roundLocked    = roundStatus[currentRound] === "locked" || roundStatus[currentRound] === "complete";

  useEffect(() => { load(); }, [currentRound]);

  const load = async () => {
    setLoading(true);
    const [g, p] = await Promise.all([DB.getGames(currentRound), DB.getPicks(user.email)]);
    setGames(g); setPicks(p.filter(x=>x.round===currentRound)); setLoading(false);
  };

  const totalWagered = picks.reduce((s,p)=>s+(p.wager||0), 0);
  const minRequired  = Math.ceil(startingPoints * 0.5);
  const roundInfo    = ROUNDS[currentRound-1];

  const savePick = async (gameId, side, wager) => {
    await DB.upsertPick({ email:user.email, game_id:gameId, round:currentRound, side, wager:parseInt(wager) });
    await load();
  };
  const clearPick = async (gameId) => { await DB.deletePick(user.email, gameId); await load(); };

  if (loading) return <div className="empty-state">Loading games...</div>;
  return (
    <div>
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
      {!roundLocked && totalWagered<minRequired && <div className="bank-warning">⚠ You must wager at least {minRequired} points this round. Currently at {totalWagered}.</div>}
      <div className="games-grid">
        {games.length===0 && <div className="empty-state">No games scheduled for this round yet.</div>}
        {games.map(game => {
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
  const { currentRound } = appData;
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [currentRound]);

  const load = async () => {
    setLoading(true);
    const [users, allPicks, allGames] = await Promise.all([DB.getAllUsers(), DB.getAllPicks(), DB.getGames()]);
    const built = users.filter(u=>!u.is_admin).map(u => {
      const myPicks = allPicks.filter(p=>p.email===u.email);
      let totalPoints = u.rounds?.[currentRound] ?? 100;
      let totalWins=0, totalLosses=0, totalPushes=0, totalWagered=0;
      myPicks.forEach(pick => {
        const game = allGames.find(g=>g.id===pick.game_id) || pick.games;
        totalWagered += pick.wager||0;
        if (game?.status==="final") {
          const {won,push} = calcResult(game, pick.side);
          if (push) totalPushes++;
          else if (won) { totalWins++; if(pick.round===currentRound) totalPoints+=pick.wager; }
          else          { totalLosses++; if(pick.round===currentRound) totalPoints-=pick.wager; }
        }
      });
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
                <span className="history-game">{game.away_team} vs {game.home_team}</span>
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
    setAdminRound(rNum); setRoundStatus({...rs}); flash(`Active round set to ${ROUNDS[rNum-1]?.name}.`); onRefresh();
  };

  const saveSpreads = async () => {
    let n=0;
    for (const [id,val] of Object.entries(localSpreads)) {
      if (val==="") continue;
      await DB.updateGame(id, { spread: parseFloat(val) }); n++;
    }
    flash(`Updated spreads for ${n} game(s).`); loadGames(adminRound);
  };

  const saveScores = async () => {
    let n=0;
    for (const [id,sc] of Object.entries(localScores)) {
      if (sc.away===""||sc.home===""||sc.away==null||sc.home==null) continue;
      await DB.updateGame(id, { away_score: parseInt(sc.away), home_score: parseInt(sc.home), status: "final" }); n++;
    }
    if (n === 0) {
      flash("No scores to save — make sure you've entered scores in both fields.", "error");
      return;
    }
    flash(`Scores saved for ${n} game(s).`); loadGames(adminRound);
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
              <div className="field" style={{marginBottom:0}}><label>AWAY TEAM</label><input value={newGame.awayTeam} onChange={e=>setNG('awayTeam',e.target.value)} placeholder="Duke" /></div>
              <div className="field" style={{marginBottom:0}}><label>SEED</label><input type="number" value={newGame.awaySeed} onChange={e=>setNG('awaySeed',e.target.value)} placeholder="1" /></div>
              <div className="field" style={{marginBottom:0}}><label>HOME TEAM</label><input value={newGame.homeTeam} onChange={e=>setNG('homeTeam',e.target.value)} placeholder="Vermont" /></div>
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
  const { currentRound, startingPoints: globalSP } = appData;
  const [players, setPlayers] = useState([]);
  const [editPts, setEditPts] = useState({});
  const [editPwd, setEditPwd] = useState({});
  const [startPts, setStartPts] = useState(globalSP.toString());
  const [msg, setMsg] = useState("");

  useEffect(() => { DB.getAllUsers().then(u=>setPlayers(u.filter(x=>!x.is_admin))); }, []);

  const flash = (t) => { setMsg(t); setTimeout(()=>setMsg(""),3000); };

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
    await DB.upsertUser({...u, rounds});
    setPlayers(prev=>prev.map(p=>p.email===email?{...p,rounds}:p));
    flash(`Updated ${u.name} to ${val} pts.`); onRefresh();
  };

  const resetPassword = async (email) => {
    const newPwd = editPwd[email]?.trim();
    if (!newPwd||newPwd.length<4) return flash("Password must be at least 4 characters.");
    const u = players.find(p=>p.email===email);
    await DB.upsertUser({...u, password:btoa(newPwd)});
    setEditPwd(prev=>({...prev,[email]:""}));
    flash(`Password reset for ${u.name}.`);
  };

  return (
    <div className="admin-section">
      <div className="admin-title">GAME SETTINGS</div>
      {msg && <div className="success-msg" style={{marginBottom:12}}>{msg}</div>}
      <div style={{background:'rgba(77,189,92,0.05)',border:'1px solid rgba(77,189,92,0.15)',padding:16,marginBottom:24}}>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)',letterSpacing:1,marginBottom:8}}>STARTING POINTS PER ROUND</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <input type="number" min="1"
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',color:'var(--chalk)',padding:'8px 12px',fontFamily:'DM Mono,monospace',fontSize:18,width:120,outline:'none'}}
            value={startPts} onChange={e=>setStartPts(e.target.value)} />
          <button className="btn btn-kelly btn-sm" onClick={saveStartingPoints}>SAVE</button>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>Currently: <strong style={{color:'var(--gold)'}}>{globalSP} pts</strong></span>
        </div>
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
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// WAGER LOG
// ============================================================
function WagerLogView() {
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
    const {won,push} = game.status==="final" ? calcResult(game,pick.side) : {won:false,push:false};
    return { email:pick.email, name:u.name, round:pick.round,
      game:`${game.away_team} vs ${game.home_team}`,
      side:pick.side==='away'?game.away_team:game.home_team,
      spread:game.spread, wager:pick.wager,
      submittedAt: pick.created_at,
      result:game.status==="final"?(push?'PUSH':won?'WIN':'LOSS'):'PENDING' };
  }).filter(Boolean);

  const filtered = wagers
    .filter(w=>filterPlayer==="all"||w.email===filterPlayer)
    .filter(w=>filterRound==="all"||w.round===parseInt(filterRound))
    .sort((a,b)=>a.round-b.round||a.name.localeCompare(b.name));

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
              <span style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--gold)'}}>{w.spread}</span>
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
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { DB.getNotifications().then(n=>{ setNotes(n); setLoading(false); }); }, []);

  const markRead    = async (id) => { await DB.updateNotification(id,{read:true}); setNotes(p=>p.map(n=>n.id===id?{...n,read:true}:n)); onRefresh(); };
  const markAllRead = async ()   => { await Promise.all(notes.filter(n=>!n.read).map(n=>DB.updateNotification(n.id,{read:true}))); setNotes(p=>p.map(n=>({...n,read:true}))); onRefresh(); };
  const deleteNote  = async (id) => { await DB.deleteNotification(id); setNotes(p=>p.filter(n=>n.id!==id)); };
  const clearAll    = async ()   => { await DB.clearNotifications(); setNotes([]); };

  const unreadCount = notes.filter(n=>!n.read).length;

  return (
    <div>
      <div className="round-banner">
        <div><div className="round-name">NOTIFICATIONS</div><div className="round-dates">{unreadCount} unread · {notes.length} total</div></div>
        <div style={{display:'flex',gap:8}}>
          {unreadCount>0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>MARK ALL READ</button>}
          {notes.length>0 && <button className="btn btn-ghost btn-sm" style={{color:'var(--red)',borderColor:'rgba(231,76,60,0.3)'}} onClick={clearAll}>CLEAR ALL</button>}
        </div>
      </div>
      {loading && <div className="empty-state">Loading...</div>}
      {!loading && notes.length===0 && <div className="empty-state">No notifications yet.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {notes.map(note => (
          <div key={note.id} style={{background:note.read?'var(--hardwood)':'rgba(77,189,92,0.06)',border:note.read?'1px solid var(--line)':'1px solid rgba(77,189,92,0.25)',padding:'16px 20px',display:'flex',alignItems:'flex-start',gap:16}}>
            <div style={{fontSize:24,flexShrink:0}}>{note.type==='forgot_password'?'🔑':'📣'}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                {!note.read && <span style={{background:'var(--kelly)',color:'var(--court)',fontSize:9,fontFamily:'DM Mono,monospace',padding:'2px 6px',letterSpacing:1}}>NEW</span>}
                <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)'}}>{note.type==='forgot_password'?'PASSWORD RESET REQUEST':'NOTIFICATION'}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'var(--chalk-dim)',marginLeft:'auto'}}>{formatCT(note.created_at)}</span>
              </div>
              <div style={{fontSize:15,color:'var(--chalk)',marginBottom:6}}>{note.message}</div>
              {note.type==='forgot_password' && <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--chalk-dim)'}}>→ Go to <strong style={{color:'var(--kelly)'}}>ADMIN → Registered Players</strong> to reset their password.</div>}
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              {!note.read && <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={()=>markRead(note.id)}>MARK READ</button>}
              <button className="btn btn-ghost btn-sm" style={{fontSize:10,color:'var(--red)',borderColor:'rgba(231,76,60,0.3)'}} onClick={()=>deleteNote(note.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
