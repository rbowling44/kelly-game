import React, { useEffect, useState } from 'react';
import { getWagersForRound } from '../../lib/supabaseGolf';
import { supabase } from '../../lib/supabaseClient';

function calcToWin(pts, oddsStr) {
  const p = parseInt(pts);
  const o = Number(oddsStr);
  if (!p || !o || isNaN(o)) return '—';
  const win = o > 0 ? Math.round(p * o / 100) : Math.round(p * 100 / Math.abs(o));
  return win;
}

function resultColor(r) {
  if (r === 'won') return 'var(--kelly)';
  if (r === 'lost') return 'var(--red)';
  return 'var(--chalk-dim)';
}

const MONO = { fontFamily: "'DM Mono', monospace" };
const TH = { ...MONO, fontSize: 11, letterSpacing: 1, color: 'var(--kelly)', padding: '10px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' };
const TD = { ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '10px 12px', borderBottom: '1px solid rgba(77,189,92,0.08)' };

export default function WagerLog({ tournamentId }) {
  const [wagers, setWagers] = useState([]);
  const [round, setRound] = useState('all');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (tournamentId) load(); }, [tournamentId, round]);

  async function load() {
    setLoading(true);
    try {
      if (round === 'all') {
        // fetch all three rounds
        const [r1, r2, r3] = await Promise.all([
          getWagersForRound(tournamentId, 1),
          getWagersForRound(tournamentId, 2),
          getWagersForRound(tournamentId, 3),
        ]);
        setWagers([...(r1||[]), ...(r2||[]), ...(r3||[])]);
      } else {
        const data = await getWagersForRound(tournamentId, Number(round));
        setWagers(data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!tournamentId) return <div className="empty-state">No active golf tournament selected.</div>;

  const players = [...new Set(wagers.map(w => w.player_name || w.user_email))].sort();

  let filtered = wagers.filter(w => {
    if (filterPlayer && (w.player_name || w.user_email) !== filterPlayer) return false;
    return true;
  });

  if (sortBy === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else if (sortBy === 'oldest') filtered = [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  else if (sortBy === 'pts_desc') filtered = [...filtered].sort((a, b) => b.points_wagered - a.points_wagered);
  else if (sortBy === 'player') filtered = [...filtered].sort((a, b) => (a.player_name||'').localeCompare(b.player_name||''));

  const SELECT_STYLE = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '6px 10px', ...MONO, fontSize: 12, outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterPlayer} onChange={e => setFilterPlayer(e.target.value)} style={SELECT_STYLE}>
          <option value="">All Players</option>
          {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={round} onChange={e => setRound(e.target.value)} style={SELECT_STYLE}>
          <option value="all">All Rounds</option>
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
          <option value="3">Round 3</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={SELECT_STYLE}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="pts_desc">Largest Wager</option>
          <option value="player">By Player</option>
        </select>
        <span style={{ ...MONO, fontSize: 11, color: 'var(--chalk-dim)', marginLeft: 4 }}>{filtered.length} wagers</span>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && filtered.length === 0 && <div className="empty-state">No wagers found.</div>}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>PLAYER</th>
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
              {filtered.map(w => (
                <tr key={w.id}>
                  <td style={TD}>{w.player_name || w.user_email}</td>
                  <td style={TD}>{w.kelly_round}</td>
                  <td style={TD}>{w.golf_golfers?.name || '—'}</td>
                  <td style={{ ...TD, textTransform: 'uppercase', letterSpacing: 1 }}>{w.category}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--gold)' }}>{w.points_wagered}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--chalk-dim)' }}>{calcToWin(w.points_wagered, w.odds_at_time)}</td>
                  <td style={{ ...TD, color: resultColor(w.result), textTransform: 'uppercase', letterSpacing: 1 }}>{w.result}</td>
                  <td style={{ ...TD, textAlign: 'right', color: w.points_won > 0 ? 'var(--kelly)' : w.points_won < 0 ? 'var(--red)' : 'var(--chalk-dim)' }}>
                    {w.points_won != null ? (w.points_won > 0 ? `+${w.points_won}` : w.points_won) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
