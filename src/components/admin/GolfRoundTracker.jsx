import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const MONO = { fontFamily: "'DM Mono', monospace" };
const TH = { ...MONO, fontSize: 11, letterSpacing: 1, color: 'var(--kelly)', padding: '10px 14px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' };
const TD = { ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '10px 14px', borderBottom: '1px solid rgba(77,189,92,0.08)' };

export default function GolfRoundTracker({ tournamentId }) {
  const [activeRound, setActiveRound] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    (async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'golf_active_kelly_round').maybeSingle();
      setActiveRound(parseInt(data?.value || '1'));
    })();
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId && activeRound) loadData(activeRound);
  }, [tournamentId, activeRound]);

  async function loadData(r) {
    setLoading(true);
    try {
      const [bankrollsRes, wagersRes, usersRes] = await Promise.all([
        supabase.from('golf_bankrolls').select('user_email, starting_points, points_remaining').eq('tournament_id', tournamentId).eq('kelly_round', r),
        supabase.from('golf_wagers').select('user_email, points_wagered, result').eq('tournament_id', tournamentId).eq('kelly_round', r),
        supabase.from('users').select('email, name').eq('is_admin', false),
      ]);

      const nameMap = {};
      (usersRes.data || []).forEach(u => { nameMap[u.email] = u.name; });

      // aggregate wager stats per user
      const wagerStats = {};
      (wagersRes.data || []).forEach(w => {
        if (!wagerStats[w.user_email]) wagerStats[w.user_email] = { count: 0, wagered: 0 };
        wagerStats[w.user_email].count++;
        wagerStats[w.user_email].wagered += w.points_wagered || 0;
      });

      const result = (bankrollsRes.data || []).map(b => {
        const stats = wagerStats[b.user_email] || { count: 0, wagered: 0 };
        const pct = b.starting_points > 0 ? Math.round(stats.wagered / b.starting_points * 100) : 0;
        return {
          email: b.user_email,
          name: nameMap[b.user_email] || b.user_email,
          picks: stats.count,
          wagered: stats.wagered,
          starting: b.starting_points,
          remaining: b.points_remaining,
          pct,
        };
      }).sort((a, b) => b.remaining - a.remaining);

      setRows(result);
    } finally {
      setLoading(false);
    }
  }

  if (!tournamentId) return <div className="empty-state">No active golf tournament selected.</div>;

  const SEL = { ...MONO, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '6px 12px', outline: 'none' };

  return (
    <div>
      <div className="round-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="round-name">ROUND TRACKER</div>
        <select value={activeRound} onChange={e => setActiveRound(Number(e.target.value))} style={SEL}>
          <option value={1}>Kelly Round 1</option>
          <option value={2}>Kelly Round 2</option>
          <option value={3}>Kelly Round 3</option>
        </select>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && rows.length === 0 && <div className="empty-state">No bankroll data for this round yet.</div>}

      {!loading && rows.length > 0 && (
        <div style={{ overflowX: 'auto', background: 'var(--hardwood)', border: '1px solid var(--line)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>PLAYER</th>
                <th style={{ ...TH, textAlign: 'right' }}>PICKS</th>
                <th style={{ ...TH, textAlign: 'right' }}>WAGERED</th>
                <th style={{ ...TH, textAlign: 'right' }}>REMAINING</th>
                <th style={{ ...TH, textAlign: 'right' }}>% WAGERED</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.email}>
                  <td style={TD}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ ...MONO, fontSize: 10, color: 'var(--chalk-dim)' }}>{r.email}</div>
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{r.picks}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--gold)' }}>{r.wagered}</td>
                  <td style={{ ...TD, textAlign: 'right', color: r.remaining > 0 ? 'var(--kelly)' : 'var(--red)' }}>{r.remaining}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(r.pct, 100)}%`, height: '100%', background: r.pct >= 50 ? 'var(--kelly)' : 'var(--gold)', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: r.pct >= 50 ? 'var(--kelly)' : 'var(--gold)', minWidth: 32 }}>{r.pct}%</span>
                    </div>
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
