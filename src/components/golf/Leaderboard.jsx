import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../../lib/supabaseGolf';

export default function GolfLeaderboard({ tournamentId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (tournamentId) load(); }, [tournamentId]);

  async function load() {
    setLoading(true);
    try {
      const data = await getLeaderboard(tournamentId);
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }

  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament selected.</div>;
  }

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <div className="lb-title">LEADERBOARD</div>
      </div>
      <div style={{ display: 'flex', padding: '8px 24px', borderBottom: '1px solid var(--line)', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--chalk-dim)', letterSpacing: 1 }}>
        <div style={{ width: 48 }}>RANK</div>
        <div style={{ flex: 1 }}>PLAYER</div>
        <div style={{ width: 100, textAlign: 'right' }}>POINTS</div>
      </div>
      {loading && <div className="empty-state">Loading...</div>}
      {!loading && rows.length === 0 && <div className="empty-state">No standings yet. Check back after Round 1 is settled.</div>}
      {rows.map((r, i) => (
        <div key={r.user_email} style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--line)', transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className={`lb-rank${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`} style={{ width: 48, fontFamily: "'Bebas Neue', sans-serif", fontSize: 24 }}>{i + 1}</div>
          <div className="lb-name" style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 18 }}>{r.name}</div>
          <div className="lb-val pts" style={{ width: 100, textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--gold)', fontWeight: 500 }}>{r.points}</div>
        </div>
      ))}
    </div>
  );
}
