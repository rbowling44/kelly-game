import React, { useState } from 'react';
import { syncLeaderboardToGolfers } from '../../lib/supabaseGolf';

export default function LeaderboardSync({ tournamentId }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function pull() {
    setLoading(true);
    setMsg('Pulling live leaderboard...');
    try {
      const res = await syncLeaderboardToGolfers(tournamentId);
      setMsg('Leaderboard synced — updated ' + (res?.length || 0) + ' golfers');
    } catch (e) {
      console.error(e);
      setMsg('Error: ' + e.message);
    }
    setLoading(false);
  }

  return (
    <div className="admin-section">
      <div className="admin-title">Leaderboard Sync</div>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <button className="btn btn-green" onClick={pull} disabled={loading}>Pull Live Leaderboard</button>
        <div style={{color:'#ccc', fontFamily:'DM Mono, monospace'}}>{msg}</div>
      </div>
    </div>
  );
}
