import React from 'react';

const S = {
  page: { maxWidth: 720, margin: '0 auto' },
  hero: {
    background: 'linear-gradient(135deg, rgba(77,189,92,0.12) 0%, rgba(77,189,92,0.04) 100%)',
    border: '1px solid rgba(77,189,92,0.3)',
    padding: '28px 32px',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    background: 'var(--kelly)',
  },
  heroTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 42,
    letterSpacing: 4,
    color: 'var(--kelly)',
    lineHeight: 1,
    marginBottom: 6,
  },
  heroSub: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: 'var(--chalk-dim)',
    letterSpacing: 2,
  },
  quickRef: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: 'var(--hardwood)',
    border: '1px solid var(--line)',
    padding: '16px 20px',
    textAlign: 'center',
  },
  statVal: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 36,
    color: 'var(--kelly)',
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: 'var(--chalk-dim)',
    letterSpacing: 1,
  },
  section: {
    background: 'var(--hardwood)',
    border: '1px solid var(--line)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--line)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: { fontSize: 20 },
  sectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 20,
    letterSpacing: 2,
    color: 'var(--chalk)',
  },
  sectionBody: {
    padding: '16px 20px',
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: 'var(--chalk-dim)',
    lineHeight: 2,
  },
  example: {
    background: 'rgba(77,189,92,0.06)',
    border: '1px solid rgba(77,189,92,0.2)',
    padding: '10px 14px',
    marginTop: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: 'var(--kelly)',
    lineHeight: 1.8,
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    marginTop: 12,
  },
  catCard: {
    border: '1px solid rgba(77,189,92,0.25)',
    padding: '12px 14px',
    background: 'rgba(77,189,92,0.04)',
  },
  catName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 18,
    letterSpacing: 2,
    color: 'var(--kelly)',
    marginBottom: 4,
  },
  catDesc: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: 'var(--chalk-dim)',
    lineHeight: 1.7,
  },
  catOdds: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: 'var(--gold)',
    marginTop: 6,
  },
  roundGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginTop: 12,
  },
  roundCard: {
    border: '1px solid var(--line)',
    padding: '12px 14px',
  },
  roundNum: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    color: 'var(--gold)',
    lineHeight: 1,
  },
  roundLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: 'var(--chalk-dim)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  roundDates: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: 'var(--chalk)',
    lineHeight: 1.6,
  },
  warnBox: {
    background: 'rgba(231,76,60,0.08)',
    border: '1px solid rgba(231,76,60,0.3)',
    padding: '12px 16px',
    marginTop: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: '#ff8070',
    lineHeight: 1.8,
  },
  tip: {
    background: 'rgba(240,224,64,0.06)',
    border: '1px solid rgba(240,224,64,0.2)',
    padding: '10px 14px',
    marginTop: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: 'var(--gold)',
    lineHeight: 1.8,
  },
};

function Section({ icon, title, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionHeader}>
        <span style={S.sectionIcon}>{icon}</span>
        <span style={S.sectionTitle}>{title}</span>
      </div>
      <div style={S.sectionBody}>{children}</div>
    </div>
  );
}

export default function GolfRules() {
  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroAccent} />
        <div style={S.heroTitle}>THE MASTERS KELLY GAME</div>
        <div style={S.heroSub}>OFFICIAL RULES & SCORING GUIDE</div>
      </div>

      {/* Quick stats */}
      <div style={S.quickRef}>
        {[
          { val: '3', label: 'KELLY ROUNDS' },
          { val: '500', label: 'STARTING PTS' },
          { val: '3', label: 'BET CATEGORIES' },
          { val: '0', label: 'CARRYOVER PTS' },
        ].map(({ val, label }) => (
          <div key={label} style={S.statCard}>
            <div style={S.statVal}>{val}</div>
            <div style={S.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* The 3 rounds */}
      <Section icon="📅" title="THE THREE KELLY ROUNDS">
        Each Kelly Round is tied to a day window of the Masters Tournament.
        Every round is a fresh betting game with its own independent bankroll.
        <div style={S.roundGrid}>
          <div style={S.roundCard}>
            <div style={S.roundLabel}>KELLY ROUND</div>
            <div style={S.roundNum}>1</div>
            <div style={S.roundDates}>Thursday + Friday<br/>First &amp; Second Rounds</div>
          </div>
          <div style={S.roundCard}>
            <div style={S.roundLabel}>KELLY ROUND</div>
            <div style={S.roundNum}>2</div>
            <div style={S.roundDates}>Saturday<br/>Third Round</div>
          </div>
          <div style={S.roundCard}>
            <div style={S.roundLabel}>KELLY ROUND</div>
            <div style={S.roundNum}>3</div>
            <div style={S.roundDates}>Sunday<br/>Final Round</div>
          </div>
        </div>
      </Section>

      {/* Starting points */}
      <Section icon="💰" title="BANKROLLS & STARTING POINTS">
        Every player begins <strong style={{ color: 'var(--chalk)' }}>Kelly Round 1</strong> with <strong style={{ color: 'var(--kelly)' }}>500 points</strong>.
        <br /><br />
        Your Round 2 bankroll equals whatever points you had remaining at the end of Round 1.
        Same for Round 3 — your Round 2 balance carries over as your new starting total.
        Play well and your bankroll grows. Go cold and you're working with a short stack.
        <div style={S.example}>
          Example: Start R1 with 500 pts → wager 400, win 320 pts profit → end with 420 pts.<br />
          Round 2 starts with 420 pts. Round 3 starts with whatever you finish R2 with.
        </div>
      </Section>

      {/* Bet categories */}
      <Section icon="🎯" title="THE THREE BET CATEGORIES">
        For each Kelly Round you can wager on golfers across three distinct categories.
        You may bet on as many golfers and categories as you like — but points are limited!
        <div style={S.catGrid}>
          <div style={S.catCard}>
            <div style={S.catName}>LEADER</div>
            <div style={S.catDesc}>Pick the golfer who posts the lowest score for that round outright. One winner per round.</div>
            <div style={S.catOdds}>Highest odds · Highest risk</div>
          </div>
          <div style={S.catCard}>
            <div style={S.catName}>TOP 5</div>
            <div style={S.catDesc}>Pick a golfer who finishes in the Top 5 for the round. Ties count — if 6 players tie for 4th, all count.</div>
            <div style={S.catOdds}>Mid-range odds</div>
          </div>
          <div style={S.catCard}>
            <div style={S.catName}>TOP 10</div>
            <div style={S.catDesc}>Pick a golfer who finishes in the Top 10 for the round. Ties count. Safest bet, lowest odds.</div>
            <div style={S.catOdds}>Lower odds · Lower risk</div>
          </div>
        </div>
      </Section>

      {/* How odds work */}
      <Section icon="📈" title="HOW ODDS WORK">
        Odds are displayed in American format. Positive odds (+) mean underdogs — you win more than you wagered.
        Negative odds (−) mean favorites — you wager more to win less.
        <div style={S.example}>
          BET 100 pts at <strong>+500</strong> → WIN 500 pts profit (collect 600 total)<br />
          BET 100 pts at <strong>+200</strong> → WIN 200 pts profit (collect 300 total)<br />
          BET 200 pts at <strong>−200</strong> → WIN 100 pts profit (collect 300 total)
        </div>
        <div style={S.tip}>
          PRO TIP: Spread your bets across categories to maximize upside.
          A small wager on a big longshot at +800 can be a game changer.
        </div>
      </Section>

      {/* Use it or lose it */}
      <Section icon="🚫" title="USE IT OR LOSE IT">
        Any points left in your bankroll at the end of a Kelly Round are <strong style={{ color: 'var(--red)' }}>forfeited</strong>.
        They do not carry forward. They do not earn interest. They disappear.
        <div style={S.warnBox}>
          ⚠️ If you start Round 1 with 500 pts and only wager 100 pts,
          your Round 2 bankroll is whatever your 100 pt bets returned — NOT 500.
          The remaining 400 pts are gone. Wager them or lose them.
        </div>
      </Section>

      {/* How to win */}
      <Section icon="🏆" title="HOW TO WIN OVERALL">
        The overall winner is the player with the most <strong style={{ color: 'var(--gold)' }}>total points accumulated</strong> across all three Kelly Rounds.
        <br /><br />
        Since bankrolls chain together (R1 → R2 → R3), a strong Round 1 gives you more firepower
        for the stretch run. But a poor Round 1 can still be overcome with smart wagering in Rounds 2 and 3.
        <div style={S.tip}>
          STRATEGY: Round 1 (Thu+Fri) has the widest field and most uncertainty — great time to take
          longshot swings. By Sunday, the leaderboard is set and you can bet with conviction.
        </div>
      </Section>
    </div>
  );
}
