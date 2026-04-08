import React, { useEffect, useState } from 'react';
import { getGolfersWithOdds, placeWager, ensureBankroll } from '../../lib/supabaseGolf';
import { supabase } from '../../lib/supabaseClient';

const CATS = [
  { key: 'leader', label: 'LEADER' },
  { key: 'top5',   label: 'TOP 5'  },
  { key: 'top10',  label: 'TOP 10' },
];

function fmtOdds(o) {
  if (!o) return null;
  const n = Number(o);
  if (isNaN(n)) return o;
  return n > 0 ? `+${n}` : `${n}`;
}

export default function Picks({ tournamentId, user }) {
  const [golfers, setGolfers]       = useState([]);
  const [round, setRound]           = useState(1);
  const [bankroll, setBankroll]     = useState(null);
  const [activeBet, setActiveBet]   = useState(null); // "golferId_category"
  const [betAmount, setBetAmount]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash]           = useState(null); // { msg, type }
  const [loading, setLoading]       = useState(false);

  useEffect(() => { if (tournamentId) init(); }, [tournamentId]);
  useEffect(() => { if (tournamentId) loadRound(round); }, [round]);

  async function init() {
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'golf_active_kelly_round').single();
    const activeRound = parseInt(setting?.value || '1');
    setRound(activeRound);
  }

  async function loadRound(r) {
    setLoading(true);
    try {
      const [g, b] = await Promise.all([
        getGolfersWithOdds(tournamentId, r),
        ensureBankroll(tournamentId, r, user.email),
      ]);
      setGolfers(g);
      setBankroll(b);
    } catch (e) {
      showFlash('Error loading: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function showFlash(msg, type = 'success') {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3000);
  }

  function toggleBet(golferId, category) {
    const key = `${golferId}_${category}`;
    if (activeBet === key) {
      setActiveBet(null);
      setBetAmount('');
    } else {
      setActiveBet(key);
      setBetAmount('');
    }
  }

  async function submitBet(golfer, category) {
    const pts = parseInt(betAmount);
    if (!pts || pts < 1) return showFlash('Enter a valid point amount.', 'error');
    if (bankroll && pts > bankroll.points_remaining) return showFlash('Not enough points remaining.', 'error');
    setSubmitting(true);
    try {
      await placeWager({
        tournament_id: tournamentId,
        kelly_round: round,
        user_id: user.email,
        golfer_id: golfer.id,
        category,
        points_wagered: pts,
        odds_at_time: fmtOdds(golfer.odds[category]) || 'TBD',
      });
      setActiveBet(null);
      setBetAmount('');
      showFlash(`Wager placed on ${golfer.name}!`);
      await loadRound(round);
    } catch (e) {
      showFlash('Error: ' + e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament. Ask the commissioner to set one up.</div>;
  }

  const withOdds    = golfers.filter(g => Object.keys(g.odds || {}).length > 0);
  const withoutOdds = golfers.filter(g => !Object.keys(g.odds || {}).length);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Banner */}
      <div className="round-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="round-name" style={{ marginBottom: 4 }}>KELLY ROUND {round}</div>
          {bankroll && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--chalk-dim)' }}>
              BANKROLL:{' '}
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{bankroll.points_remaining} PTS</span>
              <span style={{ marginLeft: 10, opacity: 0.6 }}>of {bankroll.starting_points} starting</span>
            </div>
          )}
        </div>
        <select
          value={round}
          onChange={e => setRound(Number(e.target.value))}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '6px 12px', fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none' }}
        >
          <option value={1}>Kelly Round 1</option>
          <option value={2}>Kelly Round 2</option>
          <option value={3}>Kelly Round 3</option>
        </select>
      </div>

      {/* Flash message */}
      {flash && (
        <div style={{
          background: flash.type === 'error' ? 'rgba(231,76,60,0.15)' : 'rgba(77,189,92,0.15)',
          border: `1px solid ${flash.type === 'error' ? 'rgba(231,76,60,0.4)' : 'rgba(77,189,92,0.4)'}`,
          color: flash.type === 'error' ? '#ff8070' : 'var(--kelly)',
          padding: '10px 16px',
          margin: '12px 0',
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
        }}>{flash.msg}</div>
      )}

      {loading && (
        <div style={{ color: 'var(--chalk-dim)', fontFamily: "'DM Mono', monospace", fontSize: 12, margin: '20px 0' }}>Loading...</div>
      )}

      {/* Golfers with odds */}
      {withOdds.map(g => (
        <GolferCard
          key={g.id}
          golfer={g}
          activeBet={activeBet}
          betAmount={betAmount}
          submitting={submitting}
          onToggleBet={toggleBet}
          onBetAmountChange={setBetAmount}
          onSubmit={submitBet}
        />
      ))}

      {/* Golfers without odds */}
      {withoutOdds.length > 0 && (
        <>
          <div style={{ margin: '24px 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 2 }}>NO ODDS AVAILABLE</div>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
          {withoutOdds.map(g => (
            <div key={g.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 2,
              padding: '14px 20px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: 0.45,
            }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, letterSpacing: 1, color: 'var(--chalk)' }}>{g.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)' }}>ODDS PENDING</div>
            </div>
          ))}
        </>
      )}

      {!loading && golfers.length === 0 && (
        <div className="empty-state">No golfers added yet.</div>
      )}
    </div>
  );
}

function GolferCard({ golfer, activeBet, betAmount, submitting, onToggleBet, onBetAmountChange, onSubmit }) {
  const activeCategory = activeBet?.startsWith(`${golfer.id}_`)
    ? activeBet.slice(`${golfer.id}_`.length)
    : null;

  return (
    <div style={{
      background: 'var(--hardwood)',
      border: '1px solid var(--line)',
      borderRadius: 2,
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Golfer name + bet buttons */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: 1, color: 'var(--chalk)', fontWeight: 600 }}>
          {golfer.name}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATS.map(({ key, label }) => {
            const odds = golfer.odds?.[key];
            if (!odds) return null;
            const isActive = activeBet === `${golfer.id}_${key}`;
            return (
              <button
                key={key}
                onClick={() => onToggleBet(golfer.id, key)}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: 1,
                  padding: '8px 14px',
                  border: isActive ? '1px solid var(--kelly)' : '1px solid var(--line)',
                  background: isActive ? 'rgba(77,189,92,0.15)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--kelly)' : 'var(--chalk)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {label} <span style={{ color: isActive ? 'var(--kelly)' : 'var(--gold)' }}>{fmtOdds(odds)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline bet input — only shown when this golfer has an active category */}
      {activeCategory && (
        <div style={{
          borderTop: '1px solid var(--line)',
          background: 'rgba(77,189,92,0.05)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1 }}>
            WAGER ON {activeCategory === 'leader' ? 'LEADER' : activeCategory === 'top5' ? 'TOP 5' : 'TOP 10'} @ {fmtOdds(golfer.odds[activeCategory])}
          </div>
          <input
            type="number"
            min="1"
            placeholder="Points"
            value={betAmount}
            onChange={e => onBetAmountChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit(golfer, activeCategory)}
            autoFocus
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--line)',
              color: 'var(--chalk)',
              padding: '8px 12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 16,
              width: 110,
              outline: 'none',
            }}
          />
          <button
            onClick={() => onSubmit(golfer, activeCategory)}
            disabled={submitting}
            style={{
              background: 'var(--kelly)',
              color: '#0a1a0e',
              border: 'none',
              padding: '9px 20px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              textTransform: 'uppercase',
            }}
          >
            {submitting ? 'PLACING...' : 'PLACE BET'}
          </button>
          <button
            onClick={() => onToggleBet(golfer.id, activeCategory)}
            style={{ background: 'transparent', border: 'none', color: 'var(--chalk-dim)', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
