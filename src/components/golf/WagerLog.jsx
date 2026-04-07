import React, { useEffect, useState } from 'react';
import { getWagerLog } from '../../lib/supabaseGolf';

export default function WagerLog({ tournamentId }) {
  const [log, setLog] = useState([]);
  useEffect(()=>{ if (tournamentId) load(); }, [tournamentId]);
  async function load(){
    if (!tournamentId) return;
    const data = await getWagerLog(tournamentId);
    setLog(data || []);
  }
  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament selected. Please ask the commissioner to set one in Golf Mode.</div>;
  }
  return (
    <div>
      <div className="admin-title">Wager Log</div>
      {log.length===0 && <div className="empty-state">No wagers yet.</div>}
      {log.map(l => (
        <div key={l.id} className="history-pick">
          <div className="history-game">{l.golf_golfers?.name || l.golfer_id}</div>
          <div className="history-wager">{l.points_wagered} pts • {l.category} • {l.result}</div>
        </div>
      ))}
    </div>
  );
}
