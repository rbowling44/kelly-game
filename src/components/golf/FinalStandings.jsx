import React, { useEffect, useState } from 'react';
import { getFinalStandings } from '../../lib/supabaseGolf';

const MONO = { fontFamily: "'DM Mono', monospace" };
const BEBAS = { fontFamily: "'Bebas Neue', sans-serif" };
const BARLOW = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 };

function fmtOdds(o) {
  const n = Number(o);
  if (isNaN(n)) return o || '—';
  return n > 0 ? `+${n}` : `${n}`;
}

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

const RANK_COLORS = ['var(--gold)', '#c0c0c0', '#cd7f32'];

export default function FinalStandings({ tournamentId, currentUserEmail }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { if (tournamentId) load(); }, [tournamentId]);

  async function load() {
    setLoading(true);
    try {
      const data = await getFinalStandings(tournamentId);
      setStandings(data || []);
    } finally {
      setLoading(false);
    }
  }

  if (!tournamentId) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Trophy header */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
        <div style={{ ...BEBAS, fontSize: 42, letterSpacing: 4, color: 'var(--gold)', textShadow: '0 0 32px rgba(240,192,64,0.5)' }}>
          FINAL STANDINGS
        </div>
        <div style={{ ...MONO, fontSize: 12, color: 'var(--chalk-dim)', letterSpacing: 2, marginTop: 8 }}>
          THE MASTERS KELLY GAME — TOURNAMENT COMPLETE
        </div>
      </div>

      {loading && <div className="empty-state">Loading final standings...</div>}

      {!loading && standings.length === 0 && (
        <div className="empty-state">No standings data available.</div>
      )}

      {standings.map((player, i) => {
        const isMe = player.user_email === currentUserEmail;
        const isWinner = i === 0;
        const isOpen = expanded === player.user_email;

        return (
          <div key={player.user_email} style={{
            background: isWinner ? 'rgba(240,192,64,0.08)' : isMe ? 'rgba(77,189,92,0.06)' : 'var(--hardwood)',
            border: isWinner ? '2px solid rgba(240,192,64,0.5)' : isMe ? '1px solid rgba(77,189,92,0.4)' : '1px solid var(--line)',
            borderRadius: 2,
            marginBottom: 8,
            overflow: 'hidden',
          }}>
            {/* Main row */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16, cursor: 'pointer' }}
              onClick={() => setExpanded(isOpen ? null : player.user_email)}
            >
              {/* Rank */}
              <div style={{ ...BEBAS, fontSize: 32, width: 48, textAlign: 'center', color: RANK_COLORS[i] || 'var(--chalk-dim)', lineHeight: 1 }}>
                {i + 1}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <div style={{ ...BARLOW, fontSize: 20, color: isWinner ? 'var(--gold)' : 'var(--chalk)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isWinner && <span>👑</span>}
                  {player.name}
                  {isMe && <span style={{ ...MONO, fontSize: 10, letterSpacing: 1, padding: '2px 8px', background: 'rgba(77,189,92,0.15)', border: '1px solid rgba(77,189,92,0.3)', color: 'var(--kelly)' }}>YOU</span>}
                </div>
                <div style={{ ...MONO, fontSize: 11, color: 'var(--chalk-dim)', marginTop: 2 }}>
                  {player.wagers.length} wager{player.wagers.length !== 1 ? 's' : ''} placed
                </div>
              </div>

              {/* Points */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...MONO, fontSize: 22, color: isWinner ? 'var(--gold)' : 'var(--chalk)', fontWeight: 500 }}>
                  {player.points}
                </div>
                <div style={{ ...MONO, fontSize: 10, color: 'var(--chalk-dim)', letterSpacing: 1 }}>PTS</div>
              </div>

              {/* Expand chevron */}
              <div style={{ ...MONO, fontSize: 12, color: 'var(--chalk-dim)', width: 20 }}>
                {isOpen ? '▲' : '▼'}
              </div>
            </div>

            {/* Wager history (expanded) */}
            {isOpen && player.wagers.length > 0 && (
              <div style={{ borderTop: '1px solid var(--line)', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', padding: '8px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' }}>RND</th>
                      <th style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', padding: '8px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' }}>GOLFER</th>
                      <th style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', padding: '8px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' }}>CATEGORY</th>
                      <th style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', padding: '8px 12px', textAlign: 'right', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' }}>WAGERED</th>
                      <th style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', padding: '8px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' }}>RESULT</th>
                      <th style={{ ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', padding: '8px 12px', textAlign: 'right', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' }}>PTS WON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player.wagers.map(w => (
                      <tr key={w.id}>
                        <td style={{ ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '8px 12px', borderBottom: '1px solid rgba(77,189,92,0.06)' }}>{w.kelly_round}</td>
                        <td style={{ ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '8px 12px', borderBottom: '1px solid rgba(77,189,92,0.06)' }}>{w.golf_golfers?.name || '—'}</td>
                        <td style={{ ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(77,189,92,0.06)' }}>{w.category}</td>
                        <td style={{ ...MONO, fontSize: 12, color: 'var(--gold)', padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid rgba(77,189,92,0.06)' }}>{w.points_wagered}</td>
                        <td style={{ ...MONO, fontSize: 12, color: resultColor(w.result), padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(77,189,92,0.06)' }}>{w.result}</td>
                        <td style={{ ...MONO, fontSize: 12, color: w.points_won > 0 ? 'var(--kelly)' : w.points_won < 0 ? 'var(--red)' : 'var(--chalk-dim)', padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid rgba(77,189,92,0.06)' }}>
                          {w.points_won != null ? (w.points_won > 0 ? `+${w.points_won}` : w.points_won) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isOpen && player.wagers.length === 0 && (
              <div style={{ ...MONO, fontSize: 12, color: 'var(--chalk-dim)', padding: '16px 20px', borderTop: '1px solid var(--line)' }}>No wagers placed.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
