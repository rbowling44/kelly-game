import React, { useEffect, useState } from 'react';
import { getGolfersWithOdds, placeWager, ensureBankroll, getWagersForRound } from '../../lib/supabaseGolf';
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

function calcToWin(pts, oddsStr) {
  const p = parseInt(pts);
  const o = Number(oddsStr);
  if (!p || !o || isNaN(o)) return null;
  const win = o > 0 ? Math.round(p * o / 100) : Math.round(p * 100 / Math.abs(o));
  return win;
}

const MONO = { fontFamily: "'DM Mono', monospace" };
const TH = { ...MONO, fontSize: 11, letterSpacing: 1, color: 'var(--kelly)', padding: '10px 12px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--line)' };
const TD = { ...MONO, fontSize: 12, color: 'var(--chalk)', padding: '10px 12px', borderBottom: '1px solid rgba(77,189,92,0.08)' };
const SEL = { background: '#fff', border: '1px solid var(--line)', color: '#111', padding: '6px 10px', ...MONO, fontSize: 12, outline: 'none' };

const ROUND_DAYS = { 1: 'THURS/FRI', 2: 'SAT', 3: 'SUN' };

export default function Picks({ tournamentId, user, onWagerPlaced }) {
  const [golfers, setGolfers]             = useState([]);
  const [round, setRound]                 = useState(1);
  const [bankroll, setBankroll]           = useState(null);
  const [activeBet, setActiveBet]         = useState(null);
  const [betAmount, setBetAmount]         = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [flash, setFlash]                 = useState(null);
  const [loading, setLoading]             = useState(false);
  const [wagerWindowOpen, setWagerWindowOpen] = useState(true);
  const [lockedWagers, setLockedWagers]       = useState([]);
  const [lockFilterPlayer, setLockFilterPlayer]     = useState('');
  const [lockFilterGolfer, setLockFilterGolfer]     = useState('');
  const [lockFilterCategory, setLockFilterCategory] = useState('');

  useEffect(() => { if (tournamentId) init(); }, [tournamentId]);
  useEffect(() => { if (tournamentId) loadRound(round); }, [round]);

  async function init() {
    const [{ data: setting }, { data: wwSetting }] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'golf_active_kelly_round').maybeSingle(),
      supabase.from('settings').select('value').eq('key', 'golf_wager_window_open').maybeSingle(),
    ]);
    const activeRound = parseInt(setting?.value || '1');
    const isOpen = wwSetting?.value !== 'false';
    setWagerWindowOpen(isOpen);
    setRound(activeRound);

    if (!isOpen) {
      // Load all pending wagers for locked transparency view
      try {
        const wagers = await getWagersForRound(tournamentId, activeRound);
        setLockedWagers((wagers || []).filter(w => w.result === 'pending'));
      } catch (e) {
        console.warn('Could not load locked wagers:', e.message);
      }
    }
  }

  async function loadRound(r) {
    setLoading(true);
    try {
      const g = await getGolfersWithOdds(tournamentId, r);
      setGolfers(g);
    } catch (e) {
      showFlash('Error loading golfers: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
    try {
      const b = await ensureBankroll(tournamentId, r, user.email);
      setBankroll(b);
    } catch (e) {
      console.warn('Bankroll load failed:', e.message);
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
        user_email: user.email,
        golfer_id: golfer.id,
        category,
        points_wagered: pts,
        odds_at_time: fmtOdds(golfer.odds[category]) || 'TBD',
      });
      setActiveBet(null);
      setBetAmount('');
      showFlash(`Wager placed on ${golfer.name}!`);
      await loadRound(round);
      if (onWagerPlaced) onWagerPlaced();
    } catch (e) {
      showFlash('Error: ' + e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament. Ask the commissioner to set one up.</div>;
  }

  // Inactive player check — shown before the locked/open split
  if (bankroll && bankroll.golf_active === false) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 0' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: 'var(--chalk-dim)', marginBottom: 12 }}>NOT ACTIVE</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--chalk-dim)', lineHeight: 1.9 }}>
            You are not active in this tournament.<br />Contact the commissioner if you believe this is an error.
          </div>
        </div>
      </div>
    );
  }

  const withOdds    = golfers.filter(g => Object.keys(g.odds || {}).length > 0);
  const withoutOdds = golfers.filter(g => !Object.keys(g.odds || {}).length);

  // ── Locked picks view ─────────────────────────────────────
  if (!wagerWindowOpen) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>
        {/* Locked banner */}
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.4)', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 28 }}>🔒</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--red)', marginBottom: 4 }}>WAGER WINDOW CLOSED</div>
            <div style={{ ...MONO, fontSize: 12, color: 'var(--chalk-dim)' }}>The commissioner has locked picks for this round. Check back when the window reopens.</div>
          </div>
        </div>

        {/* Explanatory note */}
        <div style={{ background: 'rgba(77,189,92,0.06)', border: '1px solid rgba(77,189,92,0.18)', padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 20, lineHeight: 1 }}>👀</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--chalk-dim)', lineHeight: 1.7 }}>
            Picks are locked for this round. Below are all pending picks for every player in The Masters Kelly Game. Use this to follow along and cheer on your golfers — and keep an eye on the competition!
          </div>
        </div>

        {/* Pending wagers transparency table */}
        {lockedWagers.length > 0 && (() => {
          const lockPlayers    = [...new Set(lockedWagers.map(w => w.player_name || w.user_email))].sort();
          const lockGolfers    = [...new Set(lockedWagers.map(w => w.golf_golfers?.name).filter(Boolean))].sort();
          const lockCategories = [...new Set(lockedWagers.map(w => w.category).filter(Boolean))].sort();
          const filteredLocked = lockedWagers.filter(w => {
            if (lockFilterPlayer && (w.player_name || w.user_email) !== lockFilterPlayer) return false;
            if (lockFilterGolfer && w.golf_golfers?.name !== lockFilterGolfer) return false;
            if (lockFilterCategory && w.category !== lockFilterCategory) return false;
            return true;
          });
          return (
            <div>
              <div style={{ ...MONO, fontSize: 11, letterSpacing: 2, color: 'var(--chalk-dim)', marginBottom: 12 }}>
                PENDING WAGERS — ROUND {round} ({ROUND_DAYS[round]})
              </div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={lockFilterPlayer} onChange={e => setLockFilterPlayer(e.target.value)} style={SEL}>
                  <option value="">All Players</option>
                  {lockPlayers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={lockFilterGolfer} onChange={e => setLockFilterGolfer(e.target.value)} style={SEL}>
                  <option value="">All Golfers</option>
                  {lockGolfers.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={lockFilterCategory} onChange={e => setLockFilterCategory(e.target.value)} style={SEL}>
                  <option value="">All Categories</option>
                  {lockCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
                <span style={{ ...MONO, fontSize: 11, color: 'var(--chalk-dim)' }}>{filteredLocked.length} wager{filteredLocked.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>PLAYER</th>
                      <th style={TH}>GOLFER</th>
                      <th style={TH}>CATEGORY</th>
                      <th style={{ ...TH, textAlign: 'right' }}>WAGERED</th>
                      <th style={{ ...TH, textAlign: 'right' }}>TO WIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocked.map(w => {
                      const isMe = w.user_email === user.email;
                      const rowBase = { borderBottom: '1px solid rgba(77,189,92,0.08)' };
                      const rowStyle = isMe ? { ...rowBase, background: 'rgba(77,189,92,0.08)', borderLeft: '3px solid var(--kelly)' } : rowBase;
                      const cellStyle = (extra) => ({ ...TD, ...extra, borderBottom: 'none' });
                      return (
                        <tr key={w.id} style={rowStyle}>
                          <td style={cellStyle({})}>
                            {w.player_name || w.user_email}
                            {isMe && <span style={{ marginLeft: 8, fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '1px 6px', background: 'rgba(77,189,92,0.2)', border: '1px solid rgba(77,189,92,0.4)', color: 'var(--kelly)' }}>YOU</span>}
                          </td>
                          <td style={cellStyle({})}>{w.golf_golfers?.name || '—'}</td>
                          <td style={cellStyle({ textTransform: 'uppercase', letterSpacing: 1 })}>{w.category}</td>
                          <td style={cellStyle({ textAlign: 'right', color: 'var(--gold)' })}>{w.points_wagered}</td>
                          <td style={cellStyle({ textAlign: 'right', color: 'var(--chalk-dim)' })}>{calcToWin(w.points_wagered, w.odds_at_time) ?? '—'}</td>
                        </tr>
                      );
                    })}
                    {filteredLocked.length === 0 && (
                      <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: 'var(--chalk-dim)', padding: '24px' }}>No wagers match the selected filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
        {lockedWagers.length === 0 && (
          <div className="empty-state">No wagers placed for this round yet.</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Banner */}
      <div className="round-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="round-name" style={{ marginBottom: 4 }}>
            KELLY ROUND {round}{ROUND_DAYS[round] ? ` (${ROUND_DAYS[round]})` : ''}
          </div>
          {bankroll && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--chalk-dim)' }}>
              BANKROLL:{' '}
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{bankroll.points_remaining} PTS</span>
              <span style={{ marginLeft: 10, opacity: 0.6 }}>of {bankroll.starting_points} starting</span>
            </div>
          )}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1 }}>
          ACTIVE ROUND
        </div>
      </div>

      {/* Reminder box */}
      <div style={{ background: 'rgba(77,189,92,0.04)', border: '1px solid rgba(77,189,92,0.12)', padding: '12px 18px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, color: 'var(--kelly)', marginBottom: 8 }}>REMINDER</div>
        <ul style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', lineHeight: 1.9, paddingLeft: 16, margin: 0 }}>
          <li>All picks are final after selecting Place Bet</li>
          <li>All picks must be made before first tee time of the day</li>
          <li>Leader, Top 5, and Top 10 refer to how the golfer finished that Kelly Round</li>
          <li>Kelly Round 1 is cumulative Thurs/Fri &nbsp;|&nbsp; Round 2 is Saturday &nbsp;|&nbsp; Round 3 is Sunday</li>
          <li>You will receive your winning points from Round 1 after the completion of Friday's tee times</li>
          <li>You will receive your winning points from Round 2 after the completion of Saturday's tee times</li>
          <li><strong style={{ color: 'var(--red)' }}>⚠️ Any unused points in a round will be forfeited</strong></li>
        </ul>
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

  const isCut = golfer.made_cut === false;

  return (
    <div style={{
      background: 'var(--hardwood)',
      border: isCut ? '1px solid rgba(231,76,60,0.3)' : '1px solid var(--line)',
      borderRadius: 2,
      marginBottom: 10,
      overflow: 'hidden',
      opacity: isCut ? 0.6 : 1,
    }}>
      {/* Golfer name + bet buttons */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: 1, color: isCut ? 'var(--chalk-dim)' : 'var(--chalk)', fontWeight: 600, textDecoration: isCut ? 'line-through' : 'none' }}>
            {golfer.name}
          </span>
          {isCut && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, padding: '2px 8px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', color: 'var(--red)' }}>
              CUT
            </span>
          )}
        </div>
        {!isCut && (
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
        )}
        {isCut && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--red)', letterSpacing: 1 }}>MISSED CUT — BETS UNAVAILABLE</div>
        )}
      </div>

      {/* Inline bet input */}
      {activeCategory && !isCut && (
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
          {betAmount && calcToWin(betAmount, golfer.odds[activeCategory]) !== null && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--kelly)', whiteSpace: 'nowrap' }}>
              → TO WIN <strong>{calcToWin(betAmount, golfer.odds[activeCategory])} PTS</strong>
            </div>
          )}
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
