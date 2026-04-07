import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

export default function GolfRoundTracker({ tournamentId }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) loadRounds();
  }, [tournamentId]);

  const loadRounds = async () => {
    setLoading(true);
    try {
      // Get wager counts for each round
      const { data: wagers, error } = await supabase
        .from('golf_wagers')
        .select('kelly_round')
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      // Count wagers per round
      const wagerCounts = {};
      (wagers || []).forEach(w => {
        wagerCounts[w.kelly_round] = (wagerCounts[w.kelly_round] || 0) + 1;
      });

      // Define golf rounds
      const golfRounds = [
        { num: 1, name: "Kelly Round 1", dates: "Thu–Fri", wagerCount: wagerCounts[1] || 0 },
        { num: 2, name: "Kelly Round 2", dates: "Sat", wagerCount: wagerCounts[2] || 0 },
        { num: 3, name: "Kelly Round 3", dates: "Sun", wagerCount: wagerCounts[3] || 0 }
      ];

      setRounds(golfRounds);
    } catch (e) {
      console.error('Error loading golf rounds:', e);
    } finally {
      setLoading(false);
    }
  };

  const getRoundStatus = (roundNum) => {
    // For now, assume rounds are upcoming/active/complete based on current date
    // In a real implementation, this would check tournament dates and round status
    const now = new Date();
    const currentYear = now.getFullYear();

    // Mock logic - in production this would check actual tournament dates
    if (roundNum === 1) return 'complete'; // Past
    if (roundNum === 2) return 'complete'; // Past
    if (roundNum === 3) return 'active';   // Current

    return 'upcoming';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return { text: 'UPCOMING', color: 'var(--chalk-dim)', bg: 'rgba(255,255,255,0.05)' };
      case 'active':
        return { text: 'ACTIVE', color: 'var(--kelly)', bg: 'rgba(77,189,92,0.1)' };
      case 'complete':
        return { text: 'COMPLETE', color: 'var(--green)', bg: 'rgba(77,189,92,0.1)' };
      default:
        return { text: 'UNKNOWN', color: 'var(--chalk-dim)', bg: 'rgba(255,255,255,0.05)' };
    }
  };

  if (!tournamentId) {
    return <div className="empty-state">No active golf tournament selected.</div>;
  }

  return (
    <div>
      <div className="round-banner">
        <div>
          <div className="round-name">GOLF ROUND TRACKER</div>
          <div className="round-dates">The Masters Kelly Game</div>
        </div>
      </div>

      {loading && <div className="empty-state">Loading...</div>}
      {!loading && (
        <div style={{background:'var(--hardwood)', border:'1px solid var(--line)'}}>
          {rounds.map((round, index) => {
            const status = getRoundStatus(round.num);
            const badge = getStatusBadge(status);

            return (
              <div key={round.num} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: index < rounds.length - 1 ? '1px solid var(--line)' : 'none'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: '24px',
                    letterSpacing: '2px',
                    color: 'var(--kelly)',
                    marginBottom: '4px'
                  }}>
                    {round.name}
                  </div>
                  <div style={{
                    fontFamily: 'DM Mono',
                    fontSize: '12px',
                    color: 'var(--chalk-dim)',
                    letterSpacing: '1px'
                  }}>
                    {round.dates}
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                  <div style={{
                    fontFamily: 'DM Mono',
                    fontSize: '14px',
                    color: 'var(--chalk)',
                    textAlign: 'right'
                  }}>
                    <div style={{marginBottom: '2px'}}>{round.wagerCount} wagers</div>
                    <div style={{fontSize: '11px', color: 'var(--chalk-dim)'}}>
                      Total placed
                    </div>
                  </div>

                  <div style={{
                    fontFamily: 'DM Mono',
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    color: badge.color,
                    background: badge.bg,
                    border: `1px solid ${badge.color}33`,
                    letterSpacing: '1px',
                    fontWeight: '500'
                  }}>
                    {badge.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}