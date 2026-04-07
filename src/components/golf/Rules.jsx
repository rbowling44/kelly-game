import React from 'react';

export default function GolfRules() {
  return (
    <div>
      <div className="admin-title">The Masters Kelly Game — Rules</div>
      <div style={{padding:16}}>
        <ul>
          <li>Players start with 500 points per Kelly Round.</li>
          <li>Three Kelly Rounds: R1 (Thu+Fri), R2 (Sat), R3 (Sun).</li>
          <li>Unspent points do not carry over. R2/R3 bankrolls come from previous round winnings.</li>
          <li>If a golfer misses the cut, bets on them are lost.</li>
          <li>Odds: R1 auto-pulled; R2/R3 set by commissioner.</li>
        </ul>
      </div>
    </div>
  );
}
