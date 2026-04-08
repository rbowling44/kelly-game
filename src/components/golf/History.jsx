import React, { useEffect, useState } from 'react';
import { getUserWagers } from '../../lib/supabaseGolf';

function calcToWin(pts, oddsStr) {
  const p = parseInt(pts);
  const o = Number(oddsStr);
  if (!p || !o || isNaN(o)) return '—';
  const win = o > 0 ? Math.round(p * o / 100) : Math.round(p * 100 / Math.abs(o));
  return win;
}

function resultBadge(r) {
  if (r === 'won')     return { label: 'WON',     color: 'var(--kelly)',    bg: 'rgba(77,189,92,0.12)',  border: 'rgba(77,189,92,0.3)' };
  if (r === 'lost')    return { label: 'LOST',    color: 'var(--red)',      bg: 'rgba(231,76,60,0.1)',   border: 'rgba(231,76,60,0.3)' };
  return                      { label: 'PENDING', color: 'var(--chalk-dim)',bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' };
}

const MONO = { fontFamily: "'DM Mono', monospace" };

export default function GolfHistory({ tournamentId, user }) {
  const [wagers, setWagers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentId && user?.email) load();
  }, [tournamentId, user]);

  async function load() {
    setLoading(true);
    try {
      const data = await getUserWagers(user.email, tournamentId);
      setWagers(data || []);
    } finally {
      setLoading(false);
    }
  }

  if (!tournamentId) return <div className="empty-state">No active golf tournament selected.</div>;

  const byRound = {};
  wagers.forEach(w => { (byRound[w.kelly_round] = byRound[w.kelly_round] || []).push(w); });
  const rounds = Object.keys(byRound).sort((a, b) => Number(b) - Number(a));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="round-banner">
        <div className="round-name">MY WAGER HISTORY</div>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && wagers.length === 0 && <div className="empty-state">No wagers placed yet.</div>}

      {rounds.map(r => (
        <div key={r} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: 'var(--chalk-dim)', borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 12 }}>
            KELLY ROUND {r}
          </div>
          {byRound[r].map(w => {
            const badge = resultBadge(w.result);
            const toWin = calcToWin(w.points_wagered, w.odds_at_time);
            return (
              <div key={w.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '12px 16px', marginBottom: 8, background: 'var(--hardwood)', border: '1px solid var(--line)' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 18, color: 'var(--chalk)' }}>{w.golf_golfers?.name || '—'}</div>
                  <div style={{ ...MONO, fontSize: 10, color: 'var(--chalk-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>{w.category} @ {w.odds_at_time}</div>
                </div>
                <div style={{ ...MONO, fontSize: 13, color: 'var(--gold)' }}>{w.points_wagered} pts wagered</div>
                <div style={{ ...MONO, fontSize: 13, color: 'var(--chalk-dim)' }}>→ {toWin} to win</div>
                <div style={{ ...MONO, fontSize: 11, padding: '3px 10px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, letterSpacing: 1 }}>{badge.label}</div>
                {w.points_won != null && w.result !== 'pending' && (
                  <div style={{ ...MONO, fontSize: 14, color: w.points_won >= 0 ? 'var(--kelly)' : 'var(--red)', fontWeight: 700 }}>
                    {w.points_won > 0 ? `+${w.points_won}` : w.points_won} pts
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
