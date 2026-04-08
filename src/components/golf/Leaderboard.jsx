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
      <div className="lb-row-header">
        <div style={{ width: 40 }}>RANK</div>
        <div style={{ flex: 1 }}>PLAYER</div>
        <div style={{ width: 80, textAlign: 'right' }}>PTS</div>
        <div style={{ width: 70, textAlign: 'right' }}>WAGERS</div>
      </div>
      {loading && <div className="empty-state">Loading...</div>}
      {!loading && rows.length === 0 && <div className="empty-state">No bankroll data yet. Check back once the round starts.</div>}
      {rows.map((r, i) => (
        <div className="lb-row" key={r.user_email} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <div className="lb-rank" style={{ width: 40 }}>{i + 1}</div>
          <div className="lb-name" style={{ flex: 1 }}>{r.name}</div>
          <div className="lb-val pts" style={{ width: 80, textAlign: 'right' }}>{r.points}</div>
          <div className="lb-val" style={{ width: 70, textAlign: 'right', fontSize: 12, color: 'var(--chalk-dim)' }}>{r.wager_count} bets</div>
        </div>
      ))}
    </div>
  );
}
