import React, { useState } from 'react';
import { fetchOutrights } from '../../lib/datagolf';
import { upsertGolfers, upsertOdds } from '../../lib/supabaseGolf';

const MARKETS = [
  { key: 'win', cat: 'win' },
  { key: 'top_5', cat: 'top5' },
  { key: 'top_10', cat: 'top10' },
  { key: 'frl', cat: 'leader' },
];

export default function OddsManager({ tournamentId, kellyRound = 1 }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function autoPull() {
    setLoading(true);
    setMsg('Pulling odds from Data Golf...');
    try {
      const allGolfers = {};
      const oddsToUpsert = [];
      for (const m of MARKETS) {
        const res = await fetchOutrights(m.key);
        if (!res || !res.data) continue;
        for (const entry of res.data) {
          const dgid = entry.id?.toString?.() ?? entry.player_id?.toString?.() ?? null;
          const name = entry.name || entry.player || entry.player_name;
          if (!dgid || !name) continue;
          if (!allGolfers[dgid]) {
            allGolfers[dgid] = { tournament_id: tournamentId, name, datagolf_id: dgid };
          }
          const marketOdds = entry.odds_american || entry.american_odds || entry.odds;
          const category = m.cat === 'win' ? 'win' : m.cat;
          // Map frl -> leader, top_5 -> top5, top_10 -> top10
          const cat = m.key === 'frl' ? 'leader' : (m.key === 'top_5' ? 'top5' : (m.key === 'top_10' ? 'top10' : 'win'));
          oddsToUpsert.push({ tournament_id: tournamentId, kelly_round: kellyRound, golfer_id: null, category: cat, american_odds: marketOdds, set_by: 'auto', datagolf_id: dgid });
        }
      }

      // Upsert golfers first to get ids
      const golfers = Object.values(allGolfers);
      if (golfers.length) {
        const upserted = await upsertGolfers(golfers);
        // upsertGolfers should return rows with ids and datagolf_id; map datagolf_id -> id
        const map = {};
        for (const g of upserted) map[g.datagolf_id] = g.id;
        // attach golfer_id to odds and upsert
        const finalOdds = oddsToUpsert.map(o => ({
          tournament_id: o.tournament_id,
          kelly_round: o.kelly_round,
          golfer_id: map[o.datagolf_id] || null,
          category: o.category,
          american_odds: o.american_odds,
          set_by: 'auto'
        }));
        await upsertOdds(finalOdds);
      }

      setMsg('Odds pulled and saved.');
    } catch (e) {
      console.error(e);
      setMsg('Error pulling odds: ' + (e.message || e));
    }
    setLoading(false);
  }

  return (
    <div className="admin-section">
      <div className="admin-title">Odds Manager</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-green" onClick={autoPull} disabled={loading}>Auto-Pull R1 Odds</button>
        <div style={{ color: '#ccc', fontFamily: 'DM Mono, monospace' }}>{msg}</div>
      </div>
    </div>
  );
}
