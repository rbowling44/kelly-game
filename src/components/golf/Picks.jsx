import React, { useEffect, useState } from 'react';
import { getGolfersWithOdds, placeWager } from '../../lib/supabaseGolf';

export default function Picks({ tournamentId, user }) {
  const [golfers, setGolfers] = useState([]);
  const [round, setRound] = useState(1);
  const [wager, setWager] = useState({});

  useEffect(() => { if (tournamentId) load(); }, [tournamentId, round]);
  async function load() {
    if (!tournamentId) return;
    const g = await getGolfersWithOdds(tournamentId, round);
    setGolfers(g);
  }

  async function submit(golferId, category) {
    const pts = Number(wager[`${golferId}_${category}`] || 0);
    if (!pts || !user) return alert('Enter points and ensure you are logged in');
    try {
      await placeWager({ tournament_id: tournamentId, kelly_round: round, user_id: user.id, golfer_id: golferId, category, points_wagered: pts, odds_at_time: 'TBD' });
      alert('Wager placed');
      load();
    } catch (e) { alert('Error: ' + e.message); }
  }

  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament selected. Please ask the commissioner to create a tournament in Golf Mode.</div>;
  }

  return (
    <div>
      <div className="round-banner">
        <div className="round-name">The Masters Kelly Game — Picks</div>
        <div>
          <select value={round} onChange={e=>setRound(Number(e.target.value))}>
            <option value={1}>Kelly Round 1</option>
            <option value={2}>Kelly Round 2</option>
            <option value={3}>Kelly Round 3</option>
          </select>
        </div>
      </div>
      <div className="game-card">
        {golfers.length === 0 && <div className="empty-state">No golfers yet.</div>}
        {golfers.map(g => (
          <div className="pick-row" key={g.id}>
            <div style={{flex:1}}>{g.name}</div>
            <div style={{width:300, display:'flex', gap:8}}>
              <div style={{flex:1}}>
                <div className="wager-label">Leader: {g.odds?.leader || '—'}</div>
                <input className="wager-input" value={wager[`${g.id}_leader`]||''} onChange={e=>setWager({...wager, [`${g.id}_leader`]: e.target.value})} />
                <button className="btn btn-sm" onClick={()=>submit(g.id,'leader')}>Bet</button>
              </div>
              <div style={{flex:1}}>
                <div className="wager-label">Top5: {g.odds?.top5 || '—'}</div>
                <input className="wager-input" value={wager[`${g.id}_top5`]||''} onChange={e=>setWager({...wager, [`${g.id}_top5`]: e.target.value})} />
                <button className="btn btn-sm" onClick={()=>submit(g.id,'top5')}>Bet</button>
              </div>
              <div style={{flex:1}}>
                <div className="wager-label">Top10: {g.odds?.top10 || '—'}</div>
                <input className="wager-input" value={wager[`${g.id}_top10`]||''} onChange={e=>setWager({...wager, [`${g.id}_top10`]: e.target.value})} />
                <button className="btn btn-sm" onClick={()=>submit(g.id,'top10')}>Bet</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
