import { useState, useEffect } from 'react';
import { addGolfer, deleteGolfer, getGolfers, saveGolferOdds, getOddsForGolfer, getPlayerBankrollsForRound } from '../../lib/supabaseGolf.js';
import { supabase } from '../../lib/supabaseClient.js';

export default function GolfModeAdmin({ tournamentId, activeKellyRound = 1 }) {
  const [golfers, setGolfers] = useState([]);
  const [newGolferName, setNewGolferName] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [oddsData, setOddsData] = useState({});
  const [selectedRound, setSelectedRound] = useState(activeKellyRound);
  
  const [players, setPlayers] = useState([]);

  // Game settings state
  const [golfStartingPoints, setGolfStartingPoints] = useState('500');
  const [wagerWindowOpen, setWagerWindowOpen] = useState('true');
  const [activeGolfRound, setActiveGolfRound] = useState('1');
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    loadData();
    loadSettings();
  }, [tournamentId, selectedRound]);

  const loadSettings = async () => {
    const [sp, ww, ar] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'golf_starting_points').single(),
      supabase.from('settings').select('value').eq('key', 'golf_wager_window_open').single(),
      supabase.from('settings').select('value').eq('key', 'golf_active_kelly_round').single(),
    ]);
    if (sp.data?.value) setGolfStartingPoints(sp.data.value);
    if (ww.data?.value) setWagerWindowOpen(ww.data.value);
    if (ar.data?.value) setActiveGolfRound(ar.data.value);
  };

  const flashSettings = (msg) => { setSettingsMsg(msg); setTimeout(() => setSettingsMsg(''), 3000); };

  const saveGolfStartingPoints = async () => {
    const val = parseInt(golfStartingPoints);
    if (!val || val < 1) return flashSettings('Enter a valid number.');
    await supabase.from('settings').upsert({ key: 'golf_starting_points', value: val.toString() });
    flashSettings(`Starting points set to ${val}.`);
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
      const [g, p] = await Promise.all([
        getGolfers(tournamentId),
        getPlayerBankrollsForRound(tournamentId, selectedRound)
      ]);
      setGolfers(g);
      setPlayers(p);
      // Load odds for all golfers
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
                <th style={STYLES.th}>TOURNAMENT ID</th>
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
                    <td style={STYLES.td}>{g.tournament_id}</td>
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
        <div style={STYLES.title}>PLAYER LIST</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={STYLES.table}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                <th style={STYLES.th}>PLAYER NAME</th>
                <th style={STYLES.th}>EMAIL</th>
                <th style={STYLES.th}>STARTING PTS</th>
                <th style={STYLES.th}>REMAINING PTS</th>
                <th style={STYLES.th}>WAGERS</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr><td style={STYLES.td} colSpan="5">No players yet</td></tr>
              ) : (
                players.map(p => (
                  <tr key={p.user_id}>
                    <td style={STYLES.td}>{p.name || 'Unknown'}</td>
                    <td style={STYLES.td}>{p.email}</td>
                    <td style={{ ...STYLES.td, color: 'var(--gold)' }}>{p.starting_points}</td>
                    <td style={{ ...STYLES.td, color: p.points_remaining >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {p.points_remaining}
                    </td>
                    <td style={STYLES.td}>{p.wager_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

        {/* Active Kelly Round */}
        <div style={{ background: 'rgba(77,189,92,0.05)', border: '1px solid rgba(77,189,92,0.15)', padding: 16 }}>
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
      </div>
    </div>
  );
}
