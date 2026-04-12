import { useState, useEffect } from 'react';
import { addGolfer, deleteGolfer, getGolfers, saveGolferOdds, getOddsForGolfer, toggleGolferCut, completeTournament, setPlayerActive } from '../../lib/supabaseGolf.js';
import { supabase } from '../../lib/supabaseClient.js';
import SettleRound from './SettleRound.jsx';

export default function GolfModeAdmin({ tournamentId, activeKellyRound = 1 }) {
  const [golfers, setGolfers] = useState([]);
  const [newGolferName, setNewGolferName] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const flashSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  
  const [oddsData, setOddsData] = useState({});
  const [selectedRound, setSelectedRound] = useState(activeKellyRound);
  
  const [players, setPlayers] = useState([]);
  const [activeBankrollRound, setActiveBankrollRound] = useState(1); // tracks which round loadData read bankrolls from
  const [editPts, setEditPts] = useState({});
  const [editPwd, setEditPwd] = useState({});

  // Game settings state
  const [golfStartingPoints, setGolfStartingPoints] = useState('500');
  const [wagerWindowOpen, setWagerWindowOpen] = useState('true');
  const [activeGolfRound, setActiveGolfRound] = useState('1');
  const [golfRegistrationLocked, setGolfRegistrationLocked] = useState('false');
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    loadData();
    loadSettings();
  }, [tournamentId, selectedRound]);

  const loadSettings = async () => {
    const [sp, ww, ar, rl] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'golf_starting_points').maybeSingle(),
      supabase.from('settings').select('value').eq('key', 'golf_wager_window_open').maybeSingle(),
      supabase.from('settings').select('value').eq('key', 'golf_active_kelly_round').maybeSingle(),
      supabase.from('settings').select('value').eq('key', 'golf_registration_locked').maybeSingle(),
    ]);
    if (sp.data?.value) setGolfStartingPoints(sp.data.value);
    if (ww.data?.value) setWagerWindowOpen(ww.data.value);
    if (ar.data?.value) setActiveGolfRound(ar.data.value);
    if (rl.data?.value) setGolfRegistrationLocked(rl.data.value);
  };

  const flashSettings = (msg) => { setSettingsMsg(msg); setTimeout(() => setSettingsMsg(''), 3000); };

  const saveGolfStartingPoints = async () => {
    const val = parseInt(golfStartingPoints);
    if (!val || val < 1) return flashSettings('Enter a valid number.');
    await supabase.from('settings').upsert({ key: 'golf_starting_points', value: val.toString() });

    // Auto-create bankrolls for all non-admin users who don't have one yet
    if (tournamentId) {
      const { data: allUsers } = await supabase.from('users').select('email, is_admin');
      const nonAdmins = (allUsers || []).filter(u => !u.is_admin);
      const { data: existing } = await supabase.from('golf_bankrolls').select('user_email').eq('tournament_id', tournamentId).eq('kelly_round', 1);
      const existingSet = new Set((existing || []).map(b => b.user_email));
      const toInsert = nonAdmins
        .filter(u => !existingSet.has(u.email))
        .map(u => ({ user_email: u.email, tournament_id: Number(tournamentId), kelly_round: 1, starting_points: val, points_remaining: val }));
      // Insert one at a time so a single failure doesn't block the rest
      let created = 0;
      for (const row of toInsert) {
        const { error: iErr } = await supabase.from('golf_bankrolls').insert(row);
        if (!iErr) created++;
      }
      await loadData();
      flashSettings(`Starting points set to ${val}. Created bankrolls for ${created} player(s).`);
    } else {
      flashSettings(`Starting points set to ${val}.`);
    }
  };

  const handleTogglePaid = async (email) => {
    const p = players.find(x => x.email === email);
    const paid = !p.paid;
    await supabase.from('users').update({ paid }).eq('email', email);
    setPlayers(prev => prev.map(x => x.email === email ? { ...x, paid } : x));
    flashSuccess(`${p.name} marked as ${paid ? 'PAID' : 'UNPAID'}.`);
  };

  const handleOverridePoints = async (email) => {
    const val = parseInt(editPts[email]);
    if (isNaN(val) || val < 0) return flashSuccess('Enter a valid point value.');
    const p = players.find(x => x.email === email);
    // Use activeBankrollRound — the round loadData reads from — NOT selectedRound (odds editor dropdown)
    const { error } = await supabase.from('golf_bankrolls')
      .update({ points_remaining: val })
      .eq('user_email', email)
      .eq('tournament_id', tournamentId)
      .eq('kelly_round', activeBankrollRound);
    if (error) return setError(error.message);
    setEditPts(prev => ({ ...prev, [email]: '' }));
    setPlayers(prev => prev.map(x => x.email === email ? { ...x, points_remaining: val } : x));
    flashSuccess(`Updated ${p.name} to ${val} pts (Round ${activeBankrollRound}).`);
  };

  const handleResetPassword = async (email) => {
    const newPwd = editPwd[email]?.trim();
    if (!newPwd || newPwd.length < 4) return setError('Password must be at least 4 characters.');
    const p = players.find(x => x.email === email);
    await supabase.from('users').update({ password: btoa(newPwd) }).eq('email', email);
    setEditPwd(prev => ({ ...prev, [email]: '' }));
    flashSuccess(`Password reset for ${p.name}.`);
  };

  const handleDeletePlayer = async (email) => {
    const p = players.find(x => x.email === email);
    if (!window.confirm(`Are you sure you want to remove ${p?.name} from this golf tournament?\n\nThis will delete their wagers and bankroll but keep their account for the NCAA game.`)) return;
    setLoading(true);
    setError('');

    // Ensure tournament_id is an integer — Supabase is strict about type matching
    const tid = parseInt(tournamentId);
    console.log('[REMOVE PLAYER] Starting delete for:', { email, tournamentId: tid, tournamentIdRaw: tournamentId });

    try {
      console.log('[REMOVE PLAYER] Deleting golf_wagers where user_email =', email, 'AND tournament_id =', tid);
      const wagersRes = await supabase
        .from('golf_wagers')
        .delete()
        .eq('user_email', email)
        .eq('tournament_id', tid);
      console.log('[REMOVE PLAYER] golf_wagers result:', { data: wagersRes.data, error: wagersRes.error, status: wagersRes.status, statusText: wagersRes.statusText });

      console.log('[REMOVE PLAYER] Deleting golf_bankrolls where user_email =', email, 'AND tournament_id =', tid);
      const bankrollsRes = await supabase
        .from('golf_bankrolls')
        .delete()
        .eq('user_email', email)
        .eq('tournament_id', tid);
      console.log('[REMOVE PLAYER] golf_bankrolls result:', { data: bankrollsRes.data, error: bankrollsRes.error, status: bankrollsRes.status, statusText: bankrollsRes.statusText });

      if (wagersRes.error) throw new Error('golf_wagers delete failed: ' + wagersRes.error.message);
      if (bankrollsRes.error) throw new Error('golf_bankrolls delete failed: ' + bankrollsRes.error.message);

      console.log('[REMOVE PLAYER] Both deletes succeeded. Reloading data...');
      await loadData();
      flashSuccess(`${p?.name} removed from tournament.`);
    } catch (e) {
      console.error('[REMOVE PLAYER] Error:', e);
      setError('Remove failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveWagerWindow = async (val) => {
    setWagerWindowOpen(val);
    await supabase.from('settings').upsert({ key: 'golf_wager_window_open', value: val });
    flashSettings(`Wager window ${val === 'true' ? 'opened' : 'closed'}.`);
  };

  const saveActiveKellyRound = async (val) => {
    setActiveGolfRound(val);
    await supabase.from('settings').upsert({ key: 'golf_active_kelly_round', value: val });
    flashSettings(`Active Kelly Round set to ${val}.`);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Read active golf kelly round from settings — do not use selectedRound (which is the NCAA round)
      const { data: arSetting } = await supabase.from('settings').select('value').eq('key', 'golf_active_kelly_round').maybeSingle();
      const bankrollRound = parseInt(arSetting?.value || '1');
      setActiveBankrollRound(bankrollRound); // persist so handleOverridePoints uses the same round

      const [g, usersRes, bankrollsRes] = await Promise.all([
        getGolfers(tournamentId),
        supabase.from('users').select('email, name, paid').eq('is_admin', false),
        supabase.from('golf_bankrolls')
          .select('user_email, starting_points, points_remaining, golf_active')
          .eq('tournament_id', tournamentId)
          .eq('kelly_round', bankrollRound),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (bankrollsRes.error) throw bankrollsRes.error;

      setGolfers(g);

      const bankrollMap = {};
      (bankrollsRes.data || []).forEach(b => { bankrollMap[b.user_email] = b; });

      setPlayers((usersRes.data || []).map(u => ({
        user_id: u.email,
        email: u.email,
        name: u.name || 'Unknown',
        paid: u.paid || false,
        starting_points: bankrollMap[u.email]?.starting_points ?? 0,
        points_remaining: bankrollMap[u.email]?.points_remaining ?? 0,
        golf_active: bankrollMap[u.email]?.golf_active !== false, // default true if no bankroll yet
      })));

      // Load odds for the selected round (odds editor uses selectedRound independently)
      const odds = {};
      for (const golfer of g) {
        const o = await getOddsForGolfer(golfer.id, selectedRound);
        odds[golfer.id] = o;
      }
      setOddsData(odds);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGolfer = async () => {
    if (!newGolferName.trim()) {
      setError('Golfer name required');
      return;
    }
    try {
      setLoading(true);
      await addGolfer(tournamentId, newGolferName.trim());
      setNewGolferName('');
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const names = bulkInput
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    if (names.length === 0) {
      setError('No names to import');
      return;
    }
    try {
      setLoading(true);
      for (const name of names) {
        await addGolfer(tournamentId, name);
      }
      setBulkInput('');
      setShowBulk(false);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGolfer = async (golferId) => {
    if (!confirm('Delete this golfer?')) return;
    try {
      setLoading(true);
      await deleteGolfer(golferId);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOddsChange = (golferId, category, value) => {
    setOddsData(prev => ({
      ...prev,
      [golferId]: { ...prev[golferId], [category]: value }
    }));
  };

  const handleSaveOdds = async (golferId) => {
    const odds = oddsData[golferId];
    if (!odds) return;
    try {
      setLoading(true);
      await Promise.all([
        odds.leader ? saveGolferOdds(tournamentId, golferId, selectedRound, 'leader', odds.leader) : null,
        odds.top5 ? saveGolferOdds(tournamentId, golferId, selectedRound, 'top5', odds.top5) : null,
        odds.top10 ? saveGolferOdds(tournamentId, golferId, selectedRound, 'top10', odds.top10) : null,
      ].filter(p => p));
      setError('');
      flashSuccess('Odds saved!');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllOdds = async () => {
    try {
      setLoading(true);
      for (const golferId of Object.keys(oddsData)) {
        const odds = oddsData[golferId];
        await Promise.all([
          odds.leader ? saveGolferOdds(tournamentId, golferId, selectedRound, 'leader', odds.leader) : null,
          odds.top5 ? saveGolferOdds(tournamentId, golferId, selectedRound, 'top5', odds.top5) : null,
          odds.top10 ? saveGolferOdds(tournamentId, golferId, selectedRound, 'top10', odds.top10) : null,
        ].filter(p => p));
      }
      setError('');
      flashSuccess('All odds saved!');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const STYLES = {
    section: {
      background: 'var(--hardwood)',
      border: '1px solid var(--line)',
      padding: '20px',
      marginBottom: '20px',
      borderRadius: '2px'
    },
    title: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '24px',
      letterSpacing: '2px',
      color: 'var(--kelly)',
      marginBottom: '16px'
    },
    label: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
      letterSpacing: '1px',
      color: 'var(--chalk-dim)',
      display: 'block',
      marginBottom: '6px'
    },
    input: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--line)',
      color: 'var(--chalk)',
      padding: '8px 12px',
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: '14px',
      outline: 'none'
    },
    textarea: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--line)',
      color: 'var(--chalk)',
      padding: '10px',
      fontFamily: "'DM Mono', monospace",
      fontSize: '12px',
      width: '100%',
      minHeight: '120px',
      outline: 'none',
      marginBottom: '8px'
    },
    btn: {
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: '700',
      fontSize: '12px',
      letterSpacing: '1px',
      padding: '8px 16px',
      border: 'none',
      cursor: 'pointer',
      textTransform: 'uppercase',
      marginRight: '8px',
      marginBottom: '8px',
      transition: 'all 0.15s'
    },
    btnKelly: {
      background: 'var(--kelly)',
      color: '#0a1a0e'
    },
    btnGhost: {
      background: 'transparent',
      color: 'var(--chalk-dim)',
      border: '1px solid var(--line)'
    },
    btnSm: {
      padding: '5px 10px',
      fontSize: '10px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '12px'
    },
    th: {
      background: 'rgba(0,0,0,0.3)',
      padding: '10px',
      textAlign: 'left',
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '12px',
      letterSpacing: '1px',
      color: 'var(--kelly)',
      borderBottom: '1px solid var(--line)'
    },
    td: {
      padding: '10px',
      borderBottom: '1px solid rgba(77,189,92,0.1)',
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
      color: 'var(--chalk)'
    },
    errorMsg: {
      background: 'rgba(231,76,60,0.15)',
      border: '1px solid rgba(231,76,60,0.4)',
      color: '#ff8070',
      padding: '10px',
      marginBottom: '12px',
      fontSize: '12px',
      fontFamily: "'DM Mono', monospace"
    }
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      {error && <div style={STYLES.errorMsg}>{error}</div>}
      {successMsg && <div style={{ background: 'rgba(77,189,92,0.15)', border: '1px solid rgba(77,189,92,0.4)', color: 'var(--kelly)', padding: '10px', marginBottom: '12px', fontSize: '12px', fontFamily: "'DM Mono', monospace" }}>{successMsg}</div>}

      {/* ========================= GOLFER MANAGEMENT ========================= */}
      <div style={STYLES.section}>
        <div style={STYLES.title}>GOLFER MANAGEMENT</div>
        <div style={{ marginBottom: '16px' }}>
          <label style={STYLES.label}>ADD SINGLE GOLFER</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Golfer name"
              value={newGolferName}
              onChange={e => setNewGolferName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGolfer()}
              style={{ ...STYLES.input, flex: 1 }}
              disabled={loading}
            />
            <button
              onClick={handleAddGolfer}
              style={{ ...STYLES.btn, ...STYLES.btnKelly }}
              disabled={loading}
            >
              ADD GOLFER
            </button>
            <button
              onClick={() => setShowBulk(!showBulk)}
              style={{ ...STYLES.btn, ...STYLES.btnGhost }}
              disabled={loading}
            >
              BULK IMPORT
            </button>
          </div>
        </div>

        {showBulk && (
          <div style={{ marginBottom: '16px' }}>
            <label style={STYLES.label}>PASTE GOLFER NAMES (ONE PER LINE)</label>
            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              style={STYLES.textarea}
              placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
              disabled={loading}
            />
            <button
              onClick={handleBulkImport}
              style={{ ...STYLES.btn, ...STYLES.btnKelly }}
              disabled={loading}
            >
              IMPORT ALL
            </button>
            <button
              onClick={() => { setShowBulk(false); setBulkInput(''); }}
              style={{ ...STYLES.btn, ...STYLES.btnGhost }}
              disabled={loading}
            >
              CANCEL
            </button>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={STYLES.table}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                <th style={STYLES.th}>GOLFER NAME</th>
                <th style={STYLES.th}>CUT STATUS</th>
                <th style={STYLES.th}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {golfers.length === 0 ? (
                <tr><td style={STYLES.td} colSpan="3">No golfers yet</td></tr>
              ) : (
                golfers.map(g => (
                  <tr key={g.id}>
                    <td style={STYLES.td}>{g.name}</td>
                    <td style={STYLES.td}>
                      <button
                        onClick={async () => {
                          const newCut = g.made_cut === false ? true : false;
                          try {
                            await toggleGolferCut(g.id, newCut);
                            await loadData();
                          } catch (e) { setError(e.message); }
                        }}
                        style={{
                          ...STYLES.btn, ...STYLES.btnSm,
                          background: g.made_cut === false ? 'rgba(231,76,60,0.15)' : 'rgba(77,189,92,0.1)',
                          border: g.made_cut === false ? '1px solid rgba(231,76,60,0.4)' : '1px solid rgba(77,189,92,0.3)',
                          color: g.made_cut === false ? 'var(--red)' : 'var(--kelly)',
                        }}
                        disabled={loading}
                      >
                        {g.made_cut === false ? '✕ MISSED CUT' : '✓ ACTIVE'}
                      </button>
                    </td>
                    <td style={STYLES.td}>
                      <button
                        onClick={() => handleDeleteGolfer(g.id)}
                        style={{ ...STYLES.btn, ...STYLES.btnGhost, ...STYLES.btnSm, color: 'var(--red)', borderColor: 'var(--red)' }}
                        disabled={loading}
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================= ODDS ENTRY ========================= */}
      <div style={STYLES.section}>
        <div style={STYLES.title}>ODDS ENTRY</div>
        <div style={{ marginBottom: '16px' }}>
          <label style={STYLES.label}>KELLY ROUND</label>
          <select
            value={selectedRound}
            onChange={e => setSelectedRound(Number(e.target.value))}
            style={{ ...STYLES.input, width: '120px' }}
            disabled={loading}
          >
            <option value={1}>Round 1</option>
            <option value={2}>Round 2</option>
            <option value={3}>Round 3</option>
          </select>
        </div>

        {golfers.length === 0 ? (
          <div style={{ color: 'var(--chalk-dim)', fontSize: '12px', fontFamily: "'DM Mono', monospace" }}>
            Add golfers first before entering odds.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={STYLES.table}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <th style={STYLES.th}>GOLFER</th>
                    <th style={STYLES.th}>LEADER ODDS</th>
                    <th style={STYLES.th}>TOP 5 ODDS</th>
                    <th style={STYLES.th}>TOP 10 ODDS</th>
                    <th style={STYLES.th}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {golfers.map(g => (
                    <tr key={g.id}>
                      <td style={STYLES.td}>{g.name}</td>
                      <td style={STYLES.td}>
                        <input
                          type="text"
                          placeholder="+450"
                          value={oddsData[g.id]?.leader || ''}
                          onChange={e => handleOddsChange(g.id, 'leader', e.target.value)}
                          style={{ ...STYLES.input, width: '80px', fontSize: '11px', padding: '6px' }}
                          disabled={loading}
                        />
                      </td>
                      <td style={STYLES.td}>
                        <input
                          type="text"
                          placeholder="+200"
                          value={oddsData[g.id]?.top5 || ''}
                          onChange={e => handleOddsChange(g.id, 'top5', e.target.value)}
                          style={{ ...STYLES.input, width: '80px', fontSize: '11px', padding: '6px' }}
                          disabled={loading}
                        />
                      </td>
                      <td style={STYLES.td}>
                        <input
                          type="text"
                          placeholder="+100"
                          value={oddsData[g.id]?.top10 || ''}
                          onChange={e => handleOddsChange(g.id, 'top10', e.target.value)}
                          style={{ ...STYLES.input, width: '80px', fontSize: '11px', padding: '6px' }}
                          disabled={loading}
                        />
                      </td>
                      <td style={STYLES.td}>
                        <button
                          onClick={() => handleSaveOdds(g.id)}
                          style={{ ...STYLES.btn, ...STYLES.btnKelly, ...STYLES.btnSm }}
                          disabled={loading}
                        >
                          SAVE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleSaveAllOdds}
              style={{ ...STYLES.btn, ...STYLES.btnKelly }}
              disabled={loading}
            >
              SAVE ALL ODDS
            </button>
          </>
        )}
      </div>

      {/* ========================= PLAYER LIST ========================= */}
      <div style={STYLES.section}>
        <div style={STYLES.title}>PLAYER LIST ({players.length})</div>
        {players.length === 0 ? (
          <div style={{ color: 'var(--chalk-dim)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>No players yet.</div>
        ) : (
          players.map(p => (
            <div key={p.user_id} style={{ background: p.golf_active ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.35)', border: p.golf_active ? '1px solid rgba(77,189,92,0.1)' : '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', opacity: p.golf_active ? 1 : 0.6 }}>
              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 16, color: p.golf_active ? 'var(--chalk)' : 'var(--chalk-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {p.name || 'Unknown'}
                  {!p.golf_active && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1, padding: '2px 7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--chalk-dim)' }}>INACTIVE</span>}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--chalk-dim)' }}>{p.email}</div>
              </div>

              {/* Points remaining */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                {p.points_remaining} <span style={{ fontSize: 10, color: 'var(--chalk-dim)' }}>/ {p.starting_points} PTS</span>
              </div>

              {/* Active/Inactive toggle */}
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await setPlayerActive(tournamentId, p.email, !p.golf_active);
                    await loadData();
                    flashSuccess(`${p.name} marked as ${!p.golf_active ? 'ACTIVE' : 'INACTIVE'}.`);
                  } catch (e) {
                    setError('Could not update active status: ' + e.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '4px 12px', cursor: 'pointer', letterSpacing: 1,
                  background: p.golf_active ? 'rgba(77,189,92,0.1)' : 'rgba(255,255,255,0.05)',
                  border: p.golf_active ? '1px solid rgba(77,189,92,0.3)' : '1px solid rgba(255,255,255,0.15)',
                  color: p.golf_active ? 'var(--kelly)' : 'var(--chalk-dim)',
                }}
              >{p.golf_active ? '✓ ACTIVE' : '○ INACTIVE'}</button>

              {/* Paid toggle */}
              <button
                onClick={() => handleTogglePaid(p.email)}
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '4px 12px', cursor: 'pointer',
                  background: p.paid ? 'rgba(77,189,92,0.15)' : 'rgba(231,76,60,0.15)',
                  border: p.paid ? '1px solid rgba(77,189,92,0.4)' : '1px solid rgba(231,76,60,0.4)',
                  color: p.paid ? 'var(--kelly)' : 'var(--red)', letterSpacing: 1,
                }}
              >{p.paid ? '✓ PAID' : '✕ UNPAID'}</button>

              {/* Points override */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--chalk-dim)' }}>PTS OVERRIDE</div>
                <input
                  type="number" min="0" placeholder={p.points_remaining.toString()}
                  value={editPts[p.email] ?? ''}
                  onChange={e => setEditPts(prev => ({ ...prev, [p.email]: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '5px 10px', fontFamily: "'DM Mono', monospace", fontSize: 13, width: 80, outline: 'none' }}
                />
                <button
                  onClick={() => handleOverridePoints(p.email)}
                  style={{ ...STYLES.btn, ...STYLES.btnKelly, ...STYLES.btnSm, marginBottom: 0, opacity: editPts[p.email] ? 1 : 0.4 }}
                >SET</button>
              </div>

              {/* Password reset */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--chalk-dim)' }}>NEW PASSWORD</div>
                <input
                  type="text" placeholder="new password"
                  value={editPwd[p.email] ?? ''}
                  onChange={e => setEditPwd(prev => ({ ...prev, [p.email]: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '5px 10px', fontFamily: "'DM Mono', monospace", fontSize: 13, width: 130, outline: 'none' }}
                />
                <button
                  onClick={() => handleResetPassword(p.email)}
                  style={{ ...STYLES.btn, ...STYLES.btnGhost, ...STYLES.btnSm, marginBottom: 0, fontSize: 11, opacity: editPwd[p.email] ? 1 : 0.4 }}
                >RESET</button>
              </div>

              {/* Delete from tournament */}
              <button
                onClick={() => handleDeletePlayer(p.email)}
                disabled={loading}
                style={{ ...STYLES.btn, ...STYLES.btnGhost, ...STYLES.btnSm, marginBottom: 0, marginLeft: 'auto', color: 'var(--red)', borderColor: 'rgba(231,76,60,0.3)', fontSize: 11 }}
              >✕ REMOVE</button>
            </div>
          ))
        )}
      </div>

      {/* ========================= GAME SETTINGS ========================= */}
      <div style={STYLES.section}>
        <div style={STYLES.title}>GAME SETTINGS</div>
        {settingsMsg && <div style={{ background: 'rgba(77,189,92,0.15)', border: '1px solid rgba(77,189,92,0.4)', color: 'var(--kelly)', padding: '10px', marginBottom: '12px', fontSize: '12px', fontFamily: "'DM Mono', monospace" }}>{settingsMsg}</div>}

        {/* Starting Points */}
        <div style={{ background: 'rgba(77,189,92,0.05)', border: '1px solid rgba(77,189,92,0.15)', padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1, marginBottom: 8 }}>STARTING POINTS (KELLY ROUND 1)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              min="1"
              value={golfStartingPoints}
              onChange={e => setGolfStartingPoints(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--line)', color: 'var(--chalk)', padding: '8px 12px', fontFamily: "'DM Mono', monospace", fontSize: 18, width: 120, outline: 'none' }}
              disabled={loading}
            />
            <button style={{ ...STYLES.btn, ...STYLES.btnKelly }} onClick={saveGolfStartingPoints} disabled={loading}>SAVE</button>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)' }}>Each player's bankroll at Round 1 start</span>
          </div>
        </div>

        {/* Wager Window */}
        <div style={{ background: wagerWindowOpen === 'true' ? 'rgba(77,189,92,0.05)' : 'rgba(231,76,60,0.06)', border: wagerWindowOpen === 'true' ? '1px solid rgba(77,189,92,0.15)' : '1px solid rgba(231,76,60,0.3)', padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1, marginBottom: 4 }}>WAGER WINDOW</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: wagerWindowOpen === 'true' ? 'var(--kelly)' : 'var(--red)' }}>
              {wagerWindowOpen === 'true' ? 'OPEN — Players can place wagers' : 'CLOSED — Wagers are disabled'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...STYLES.btn, ...(wagerWindowOpen === 'true' ? STYLES.btnKelly : STYLES.btnGhost) }}
              onClick={() => saveWagerWindow('true')}
              disabled={loading}
            >OPEN</button>
            <button
              style={{ ...STYLES.btn, ...(wagerWindowOpen === 'false' ? { background: 'var(--red)', color: '#fff' } : STYLES.btnGhost) }}
              onClick={() => saveWagerWindow('false')}
              disabled={loading}
            >CLOSED</button>
          </div>
        </div>

        {/* Registration Lock */}
        <div style={{ background: golfRegistrationLocked === 'true' ? 'rgba(231,76,60,0.06)' : 'rgba(77,189,92,0.05)', border: golfRegistrationLocked === 'true' ? '1px solid rgba(231,76,60,0.3)' : '1px solid rgba(77,189,92,0.15)', padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1, marginBottom: 4 }}>GOLF REGISTRATION</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: golfRegistrationLocked === 'true' ? 'var(--red)' : 'var(--kelly)' }}>
              {golfRegistrationLocked === 'true' ? 'LOCKED — New registrations disabled' : 'OPEN — New players can register'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...STYLES.btn, ...(golfRegistrationLocked !== 'true' ? STYLES.btnKelly : STYLES.btnGhost) }}
              onClick={async () => {
                setGolfRegistrationLocked('false');
                await supabase.from('settings').upsert({ key: 'golf_registration_locked', value: 'false' });
                flashSettings('Golf registration opened.');
              }}
              disabled={loading}
            >OPEN</button>
            <button
              style={{ ...STYLES.btn, ...(golfRegistrationLocked === 'true' ? { background: 'var(--red)', color: '#fff' } : STYLES.btnGhost) }}
              onClick={async () => {
                setGolfRegistrationLocked('true');
                await supabase.from('settings').upsert({ key: 'golf_registration_locked', value: 'true' });
                flashSettings('Golf registration locked.');
              }}
              disabled={loading}
            >LOCK</button>
          </div>
        </div>

        {/* Active Kelly Round */}
        <div style={{ background: 'rgba(77,189,92,0.05)', border: '1px solid rgba(77,189,92,0.15)', padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1, marginBottom: 8 }}>ACTIVE KELLY ROUND</div>
          <select
            value={activeGolfRound}
            onChange={e => saveActiveKellyRound(e.target.value)}
            style={{ ...STYLES.input, width: 160 }}
            disabled={loading}
          >
            <option value="1">Round 1</option>
            <option value="2">Round 2</option>
            <option value="3">Round 3</option>
          </select>
        </div>

        {/* Complete Tournament */}
        <div style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.2)', padding: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', letterSpacing: 1, marginBottom: 6 }}>TOURNAMENT COMPLETE</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', marginBottom: 12, lineHeight: 1.6 }}>
            After settling Round 3, mark the tournament as complete. This shows a Final Standings page to all players.
          </div>
          <button
            style={{ ...STYLES.btn, background: 'var(--gold)', color: '#0a1a0e' }}
            disabled={loading || !tournamentId}
            onClick={async () => {
              if (!window.confirm('Mark this tournament as COMPLETE?\n\nThis will show the Final Standings view to all players. This cannot be undone.')) return;
              setLoading(true);
              try {
                await completeTournament(tournamentId);
                flashSettings('Tournament marked as complete. Final Standings are now live.');
              } catch (e) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            🏆 MARK TOURNAMENT COMPLETE
          </button>
        </div>
      </div>

      {/* ========================= SETTLE ROUND ========================= */}
      <SettleRound tournamentId={tournamentId} />

      {/* ========================= DANGER ZONE ========================= */}
      <div style={{ background: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.2)', padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--red)', marginBottom: 8 }}>DANGER ZONE</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--chalk-dim)', marginBottom: 16, lineHeight: 1.6 }}>
          Full reset: deletes all wagers and bankrolls, resets tournament to Round 1, reopens wager window, and clears all missed-cut flags. Golfers and odds are kept. Use for testing only.
        </div>
        <button
          style={{ ...STYLES.btn, background: 'var(--red)', color: '#fff', border: 'none' }}
          disabled={loading}
          onClick={async () => {
            if (!tournamentId) return flashSettings('No active tournament.');
            if (!window.confirm('⚠️ RESET ALL GOLF DATA?\n\nThis will delete ALL wagers and bankrolls for this tournament and reset to Round 1.\n\nThis cannot be undone.')) return;
            setLoading(true);
            try {
              await Promise.all([
                // 1. Delete all wagers for this tournament
                supabase.from('golf_wagers').delete().eq('tournament_id', tournamentId),
                // 2. Delete all bankrolls for this tournament
                supabase.from('golf_bankrolls').delete().eq('tournament_id', tournamentId),
                // 3. Reset tournament status to 'upcoming' and active round to 1
                supabase.from('golf_tournaments').update({ status: 'upcoming', active_kelly_round: 1 }).eq('id', tournamentId),
                // 4 & 5. Reset settings
                supabase.from('settings').upsert({ key: 'golf_active_kelly_round', value: '1' }),
                supabase.from('settings').upsert({ key: 'golf_wager_window_open', value: 'false' }),
                supabase.from('settings').upsert({ key: 'golf_last_settled_round', value: '' }),
                // 6. Clear missed-cut flags on all golfers in this tournament
                supabase.from('golf_golfers').update({ made_cut: true }).eq('tournament_id', tournamentId),
              ]);
              // 7. Reload everything to reflect fresh state
              setActiveGolfRound('1');
              setWagerWindowOpen('false');
              await loadData();
              await loadSettings();
              flashSuccess('Full reset complete. Tournament is back to Round 1.');
            } catch (e) {
              setError('Reset failed: ' + e.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          🗑 RESET ALL GOLF DATA
        </button>
      </div>
    </div>
  );
}
