import React, { useState } from 'react';
import { settleRound } from '../../lib/supabaseGolf';

export default function SettleRound({ tournamentId }) {
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  async function doSettle() {
    setLoading(true);
    setResultMsg('');
    try {
      const res = await settleRound({ tournament_id: tournamentId, kelly_round: round });
      setResultMsg('Settle complete — users processed: ' + (res?.length || 0));
    } catch (e) {
      console.error(e);
      setResultMsg('Settle failed: ' + (e.message || e));
    }
    setLoading(false);
  }

  return (
    <div className="admin-section">
      <div className="admin-title">Settle Round</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={round} onChange={e => setRound(Number(e.target.value))} style={{ padding: 8 }}>
          <option value={1}>Kelly Round 1</option>
          <option value={2}>Kelly Round 2</option>
          <option value={3}>Kelly Round 3</option>
        </select>
        <button className="btn btn-kelly" onClick={doSettle} disabled={loading}>Settle Round</button>
        <div style={{ color: '#ccc', fontFamily: 'DM Mono, monospace' }}>{resultMsg}</div>
      </div>
    </div>
  );
}
