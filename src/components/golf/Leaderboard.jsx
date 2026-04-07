import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../../lib/supabaseGolf';

export default function GolfLeaderboard({ tournamentId }) {
  const [rows, setRows] = useState([]);
  useEffect(()=>{ if (tournamentId) load(); }, [tournamentId]);
  async function load(){
    if (!tournamentId) return;
    const data = await getLeaderboard(tournamentId);
    setRows(data || []);
  }
  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament selected. Please ask the commissioner to set one in Golf Mode.</div>;
  }
  return (
    <div className="leaderboard">
      <div className="lb-header"><div className="lb-title">Leaderboard</div></div>
      <div className="lb-row-header"><div>Rank</div><div>Player</div><div>Points</div></div>
      {rows.length===0 && <div className="empty-state">No leaderboard data.</div>}
      {rows.map((r, i)=> (
        <div className={`lb-row ${i===0? 'me':''}`} key={r.user_id}>
          <div className="lb-rank">{i+1}</div>
          <div className="lb-name">{r.user_id}</div>
          <div className="lb-val pts">{r.points}</div>
        </div>
      ))}
    </div>
  );
}
