import React, { useState, useEffect } from 'react';
import { getGolfers, settleRoundClient } from '../../lib/supabaseGolf';

const MONO = { fontFamily: "'DM Mono', monospace" };
const BEBAS = { fontFamily: "'Bebas Neue', sans-serif" };
const BARLOW = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 };

const S = {
  section: { background: 'var(--hardwood)', border: '1px solid var(--line)', padding: 20, marginBottom: 20 },
  title: { ...BEBAS, fontSize: 22, letterSpacing: 2, color: 'var(--kelly)', marginBottom: 16 },
  label: { ...MONO, fontSize: 10, letterSpacing: 1, color: 'var(--chalk-dim)', display: 'block', marginBottom: 6 },
  select: { ...MONO, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '8px 12px', outline: 'none', width: '100%' },
  row: { marginBottom: 16 },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, marginTop: 6 },
  checkItem: (checked) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 12px',
    background: checked ? 'rgba(77,189,92,0.12)' : 'rgba(255,255,255,0.03)',
    border: checked ? '1px solid rgba(77,189,92,0.4)' : '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
    transition: 'all 0.12s',
  }),
  checkLabel: (checked) => ({
    ...BARLOW, fontSize: 13, letterSpacing: 0.5,
    color: checked ? 'var(--kelly)' : 'var(--chalk-dim)',
    flex: 1,
  }),
  btn: { ...BARLOW, fontSize: 13, letterSpacing: 1, padding: '10px 24px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' },
  btnKelly: { background: 'var(--kelly)', color: '#0a1a0e' },
  result: (ok) => ({
    ...MONO, fontSize: 12, padding: '10px 14px', marginTop: 12,
    background: ok ? 'rgba(77,189,92,0.1)' : 'rgba(231,76,60,0.1)',
    border: ok ? '1px solid rgba(77,189,92,0.3)' : '1px solid rgba(231,76,60,0.3)',
    color: ok ? 'var(--kelly)' : '#ff8070',
  }),
  divider: { height: 1, background: 'var(--line)', margin: '16px 0' },
  infoBox: { ...MONO, fontSize: 11, color: 'var(--chalk-dim)', background: 'rgba(77,189,92,0.05)', border: '1px solid rgba(77,189,92,0.15)', padding: '10px 14px', lineHeight: 1.8, marginBottom: 16 },
};

function CheckItem({ golfer, checked, onChange }) {
  return (
    <div style={S.checkItem(checked)} onClick={() => onChange(golfer.id)}>
      <div style={{ width: 14, height: 14, border: `2px solid ${checked ? 'var(--kelly)' : 'rgba(255,255,255,0.2)'}`, background: checked ? 'rgba(77,189,92,0.3)' : 'transparent', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <span style={{ fontSize: 9, color: 'var(--kelly)' }}>✓</span>}
      </div>
      <span style={S.checkLabel(checked)}>{golfer.name}</span>
    </div>
  );
}

export default function SettleRound({ tournamentId }) {
  const [round, setRound]     = useState(1);
  const [golfers, setGolfers] = useState([]);
  const [leader, setLeader]   = useState('');   // golfer id string or ''
  const [top5, setTop5]       = useState([]);   // array of golfer ids
  const [top10, setTop10]     = useState([]);   // array of golfer ids
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [resultMsg, setResultMsg] = useState(null); // { ok, text }
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    (async () => {
      setFetching(true);
      try { setGolfers(await getGolfers(tournamentId)); }
      catch (e) { console.error(e); }
      finally { setFetching(false); }
    })();
  }, [tournamentId]);

  // Reset selections when round changes
  useEffect(() => {
    setLeader('');
    setTop5([]);
    setTop10([]);
    setResultMsg(null);
    setConfirmed(false);
  }, [round]);

  function toggleArr(setArr, id) {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Adding to top5 also auto-adds to top10 (top5 ⊆ top10)
  function toggleTop5(id) {
    setTop5(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      setTop10(t => t.includes(id) ? t : [...t, id]);
      return [...prev, id];
    });
  }

  async function doSettle() {
    if (!leader && top5.length === 0 && top10.length === 0) {
      setResultMsg({ ok: false, text: 'Select at least a leader or some top-5/top-10 finishers before settling.' });
      return;
    }
    setLoading(true);
    setResultMsg(null);
    try {
      const results = {
        leader: leader ? Number(leader) : null,
        top5:   top5.map(Number),
        top10:  top10.map(Number),
      };
      const count = await settleRoundClient({ tournament_id: tournamentId, kelly_round: round, results });
      setResultMsg({ ok: true, text: `Round ${round} settled — ${count} wager(s) processed. Next round bankrolls seeded from this round's results.` });
      setConfirmed(false);
    } catch (e) {
      console.error(e);
      setResultMsg({ ok: false, text: 'Settle failed: ' + (e.message || e) });
    }
    setLoading(false);
  }

  if (!tournamentId) return null;

  return (
    <div style={S.section}>
      <div style={S.title}>SETTLE ROUND</div>

      <div style={S.infoBox}>
        Select the results for each category, then hit Confirm &amp; Settle.
        Anyone not listed in a winning category automatically loses their wager.
        After settling Round 1 or 2, the next round's bankrolls are automatically seeded.
      </div>

      {/* Round selector */}
      <div style={{ ...S.row, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <label style={S.label}>KELLY ROUND TO SETTLE</label>
          <select value={round} onChange={e => setRound(Number(e.target.value))} style={{ ...S.select, width: 200 }} disabled={loading}>
            <option value={1}>Kelly Round 1 — Thu/Fri</option>
            <option value={2}>Kelly Round 2 — Sat</option>
            <option value={3}>Kelly Round 3 — Sun</option>
          </select>
        </div>
      </div>

      {fetching && <div style={{ ...MONO, fontSize: 12, color: 'var(--chalk-dim)', padding: '8px 0' }}>Loading golfers...</div>}

      {!fetching && golfers.length > 0 && (
        <>
          <div style={S.divider} />

          {/* Round Leader */}
          <div style={S.row}>
            <label style={S.label}>🥇 ROUND LEADER — Who posted the lowest score this round?</label>
            <select value={leader} onChange={e => setLeader(e.target.value)} style={{ ...S.select, width: 280 }} disabled={loading}>
              <option value="">— None —</option>
              {golfers.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Top 5 */}
          <div style={S.row}>
            <label style={S.label}>🏅 TOP 5 FINISHERS — Select all who finished top 5 (ties count)</label>
            <div style={S.checkGrid}>
              {golfers.map(g => (
                <CheckItem key={g.id} golfer={g} checked={top5.includes(g.id)} onChange={toggleTop5} />
              ))}
            </div>
          </div>

          {/* Top 10 */}
          <div style={S.row}>
            <label style={S.label}>🎯 TOP 10 FINISHERS — Select all who finished top 10 (ties count)</label>
            <div style={S.checkGrid}>
              {golfers.map(g => (
                <CheckItem key={g.id} golfer={g} checked={top10.includes(g.id)} onChange={id => toggleArr(setTop10, id)} />
              ))}
            </div>
          </div>

          <div style={S.divider} />

          {/* Summary */}
          <div style={{ ...MONO, fontSize: 11, color: 'var(--chalk-dim)', marginBottom: 14, lineHeight: 1.9 }}>
            <strong style={{ color: 'var(--chalk)', letterSpacing: 1 }}>SUMMARY</strong><br />
            Leader: <span style={{ color: 'var(--kelly)' }}>{leader ? (golfers.find(g => g.id === Number(leader))?.name ?? '—') : '—'}</span><br />
            Top 5: <span style={{ color: 'var(--kelly)' }}>{top5.length > 0 ? top5.map(id => golfers.find(g => g.id === id)?.name).join(', ') : '—'}</span><br />
            Top 10: <span style={{ color: 'var(--kelly)' }}>{top10.length > 0 ? top10.map(id => golfers.find(g => g.id === id)?.name).join(', ') : '—'}</span>
          </div>

          {/* Confirm checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }} onClick={() => setConfirmed(c => !c)}>
            <div style={{ width: 16, height: 16, border: `2px solid ${confirmed ? 'var(--kelly)' : 'rgba(255,255,255,0.2)'}`, background: confirmed ? 'rgba(77,189,92,0.3)' : 'transparent', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {confirmed && <span style={{ fontSize: 10, color: 'var(--kelly)' }}>✓</span>}
            </div>
            <span style={{ ...MONO, fontSize: 11, color: confirmed ? 'var(--chalk)' : 'var(--chalk-dim)' }}>
              I've verified the results above and I'm ready to settle Round {round}
            </span>
          </div>

          <button
            style={{ ...S.btn, ...S.btnKelly, opacity: confirmed && !loading ? 1 : 0.4, cursor: confirmed && !loading ? 'pointer' : 'not-allowed' }}
            onClick={doSettle}
            disabled={!confirmed || loading}
          >
            {loading ? 'SETTLING...' : `CONFIRM & SETTLE ROUND ${round}`}
          </button>

          {resultMsg && <div style={S.result(resultMsg.ok)}>{resultMsg.text}</div>}
        </>
      )}

      {!fetching && golfers.length === 0 && (
        <div style={{ ...MONO, fontSize: 12, color: 'var(--chalk-dim)' }}>No golfers found for this tournament.</div>
      )}
    </div>
  );
}
