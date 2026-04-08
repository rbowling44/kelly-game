import React, { useEffect, useState } from 'react';
import { getWagersForRound } from '../../lib/supabaseGolf';

function calcToWin(pts, oddsStr) {
  const p = parseInt(pts);
  const o = Number(oddsStr);
  if (!p || !o || isNaN(o)) return null;
  return o > 0 ? Math.round(p * o / 100) : Math.round(p * 100 / Math.abs(o));
}

function resultColor(r) {
  if (r === 'won') return 'var(--kelly)';
  if (r === 'lost') return 'var(--red)';
  return 'var(--chalk-dim)';
}

const MONO = { fontFamily: "'DM Mono', monospace" };
const TH = { ...MONO, fontSize: 11, letterSpacing: 1, color: 'var(--kelly)', padding: '10px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' };
const TD = { ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '10px 12px', borderBottom: '1px solid rgba(77,189,92,0.08)' };
const SEL = { background: '#fff', border: '1px solid var(--line)', color: '#111', padding: '6px 10px', ...MONO, fontSize: 12, outline: 'none' };

// isAdmin: true = admin full log, false = player view (no pending)
export default function WagerLog({ tournamentId, isAdmin = false }) {
  const [wagers, setWagers] = useState([]);
  const [round, setRound] = useState('all');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterGolfer, setFilterGolfer] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (tournamentId) load(); }, [tournamentId, round]);

  async function load() {
    setLoading(true);
    try {
      if (round === 'all') {
        const [r1, r2, r3] = await Promise.all([
          getWagersForRound(tournamentId, 1),
          getWagersForRound(tournamentId, 2),
          getWagersForRound(tournamentId, 3),
        ]);
        setWagers([...(r1 || []), ...(r2 || []), ...(r3 || [])]);
      } else {
        setWagers((await getWagersForRound(tournamentId, Number(round))) || []);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!tournamentId) return <div className="empty-state">No active golf tournament selected.</div>;

  // Build filter option lists
  const players    = [...new Set(wagers.map(w => w.player_name || w.user_email))].sort();
  const golfers    = [...new Set(wagers.map(w => w.golf_golfers?.name).filter(Boolean))].sort();
  const categories = [...new Set(wagers.map(w => w.category).filter(Boolean))].sort();

  let filtered = wagers.filter(w => {
    if (!isAdmin && w.result === 'pending') return false;
    if (filterPlayer && (w.player_name || w.user_email) !== filterPlayer) return false;
    if (filterGolfer && w.golf_golfers?.name !== filterGolfer) return false;
    if (filterCategory && w.category !== filterCategory) return false;
    return true;
  });

  if (sortBy === 'newest')   filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else if (sortBy === 'oldest')   filtered = [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  else if (sortBy === 'pts_desc') filtered = [...filtered].sort((a, b) => b.points_wagered - a.points_wagered);
  else if (sortBy === 'towin_desc') filtered = [...filtered].sort((a, b) => (calcToWin(b.points_wagered, b.odds_at_time) || 0) - (calcToWin(a.points_wagered, a.odds_at_time) || 0));
  else if (sortBy === 'player')   filtered = [...filtered].sort((a, b) => (a.player_name || '').localeCompare(b.player_name || ''));

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {isAdmin && (
          <select value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)} style={SEL}>
            <option value="">All Players</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <select value={filterGolfer} onChange={e => setFilterGolfer(e.target.value)} style={SEL}>
          <option value="">All Golfers</option>
          {golfers.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={SEL}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c} style={{ textTransform: 'uppercase' }}>{c.toUpperCase()}</option>)}
        </select>
        <select value={round} onChange={e => setRound(e.target.value)} style={SEL}>
          <option value="all">All Rounds</option>
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
          <option value="3">Round 3</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={SEL}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="pts_desc">Largest Wager</option>
          <option value="towin_desc">Largest To Win</option>
          <option value="player">By Player</option>
        </select>
        <span style={{ ...MONO, fontSize: 11, color: 'var(--chalk-dim)' }}>{filtered.length} wagers</span>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && filtered.length === 0 && <div className="empty-state">No wagers found.</div>}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {isAdmin && <th style={TH}>PLAYER</th>}
                <th style={TH}>RND</th>
                <th style={TH}>GOLFER</th>
                <th style={TH}>CATEGORY</th>
                <th style={{ ...TH, textAlign: 'right' }}>WAGERED</th>
                <th style={{ ...TH, textAlign: 'right' }}>TO WIN</th>
                <th style={TH}>RESULT</th>
                <th style={{ ...TH, textAlign: 'right' }}>PTS WON</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const toWin = calcToWin(w.points_wagered, w.odds_at_time);
                return (
                  <tr key={w.id}>
                    {isAdmin && <td style={TD}>{w.player_name || w.user_email}</td>}
                    <td style={TD}>{w.kelly_round}</td>
                    <td style={TD}>{w.golf_golfers?.name || '—'}</td>
                    <td style={{ ...TD, textTransform: 'uppercase', letterSpacing: 1 }}>{w.category}</td>
                    <td style={{ ...TD, textAlign: 'right', color: 'var(--gold)' }}>{w.points_wagered}</td>
                    <td style={{ ...TD, textAlign: 'right', color: 'var(--chalk-dim)' }}>{toWin ?? '—'}</td>
                    <td style={{ ...TD, color: resultColor(w.result), textTransform: 'uppercase', letterSpacing: 1 }}>{w.result}</td>
                    <td style={{ ...TD, textAlign: 'right', color: w.points_won > 0 ? 'var(--kelly)' : w.points_won < 0 ? 'var(--red)' : 'var(--chalk-dim)' }}>
                      {w.points_won != null ? (w.points_won > 0 ? `+${w.points_won}` : w.points_won) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
