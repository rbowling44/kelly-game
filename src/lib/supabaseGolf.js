import { supabase } from './supabaseClient.js';
import { fetchLeaderboard } from './datagolf';

async function placeWager({ tournament_id, kelly_round, user_email, golfer_id, category, points_wagered, odds_at_time }) {
  const { data, error } = await supabase.rpc('golf_place_wager', {
    p_tournament_id: tournament_id,
    p_kelly_round: kelly_round,
    p_user_email: user_email,
    p_golfer_id: golfer_id,
    p_category: category,
    p_points_wagered: points_wagered,
    p_odds_at_time: odds_at_time,
  });
  if (error) throw error;
  return data;
}

async function settleRound({ tournament_id, kelly_round }) {
  const { data, error } = await supabase.rpc('golf_settle_round', { p_tournament_id: tournament_id, p_kelly_round: kelly_round });
  if (error) throw error;
  return data;
}

async function upsertGolfers(golfers) {
  const { data, error } = await supabase.from('golf_golfers').upsert(golfers, { onConflict: 'datagolf_id,tournament_id' });
  if (error) throw error;
  return data;
}

async function upsertOdds(odds) {
  const { data, error } = await supabase.from('golf_odds').upsert(odds, { onConflict: 'tournament_id,kelly_round,golfer_id,category' });
  if (error) throw error;
  return data;
}

async function getTournament(id) {
  const { data, error } = await supabase.from('golf_tournaments').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function getGolfersWithOdds(tournament_id, kelly_round) {
  const { data, error } = await supabase
    .from('golf_golfers')
    .select(`id, name, datagolf_id, made_cut, final_position, golf_odds(id, category, american_odds, set_by)`)
    .eq('tournament_id', tournament_id)
    .order('name', { ascending: true });
  if (error) throw error;
  // reshape so golf_odds entries are easier to consume
  return (data || []).map(g => ({
    id: g.id,
    name: g.name,
    datagolf_id: g.datagolf_id,
    made_cut: g.made_cut,
    final_position: g.final_position,
    odds: (g.golf_odds || []).reduce((acc, o) => { acc[o.category] = o.american_odds; return acc; }, {})
  }));
}

async function getUserWagers(user_email, tournament_id) {
  const { data, error } = await supabase.from('golf_wagers').select('*, golf_golfers(name)').eq('user_email', user_email).eq('tournament_id', tournament_id).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getWagerLog(tournament_id) {
  const { data, error } = await supabase.from('golf_wagers').select('*, golf_golfers(name)').eq('tournament_id', tournament_id).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function syncLeaderboardToGolfers(tournament_id) {
  // fetch datagolf leaderboard feed and upsert made_cut and final_position by datagolf_id
  const res = await fetchLeaderboard();
  const players = res?.data || res?.players || res || [];
  const updates = [];
  for (const p of players) {
    const datagolf_id = p.id?.toString?.() ?? p.player_id?.toString?.() ?? null;
    const name = p.name || p.player || p.player_name;
    const made_cut = p.made_cut === undefined ? (p.cut === false ? false : true) : p.made_cut;
    const final_position = p.position || p.position_final || p.final_position || null;
    if (!datagolf_id) continue;
    updates.push({ tournament_id, datagolf_id: datagolf_id.toString(), name, made_cut, final_position });
  }
  if (updates.length) {
    const { data, error } = await supabase.from('golf_golfers').upsert(updates, { onConflict: 'datagolf_id,tournament_id' });
    if (error) throw error;
    return data;
  }
  return [];
}

async function getLeaderboard(tournament_id) {
  // Use golf_bankrolls as the source of truth — sum points_remaining across rounds per player
  const { data: bankrolls, error: bErr } = await supabase
    .from('golf_bankrolls')
    .select('user_email, points_remaining')
    .eq('tournament_id', tournament_id);
  if (bErr) throw bErr;

  const { data: wagers, error: wErr } = await supabase
    .from('golf_wagers')
    .select('user_email')
    .eq('tournament_id', tournament_id);
  if (wErr) throw wErr;

  const emails = [...new Set((bankrolls || []).map(b => b.user_email))];
  const { data: users, error: uErr } = await supabase.from('users').select('email, name').in('email', emails);
  if (uErr) throw uErr;

  const nameMap = {};
  (users || []).forEach(u => { nameMap[u.email] = u.name; });

  const wagerCounts = {};
  (wagers || []).forEach(w => { wagerCounts[w.user_email] = (wagerCounts[w.user_email] || 0) + 1; });

  // Sum points_remaining across all kelly rounds for each player
  const totals = {};
  (bankrolls || []).forEach(b => { totals[b.user_email] = (totals[b.user_email] || 0) + b.points_remaining; });

  return Object.entries(totals)
    .map(([user_email, points]) => ({ user_email, name: nameMap[user_email] || user_email, points, wager_count: wagerCounts[user_email] || 0 }))
    .sort((a, b) => b.points - a.points);
}

async function addGolfer(tournament_id, name) {
  const { data, error } = await supabase.from('golf_golfers').insert({ tournament_id, name }).select().single();
  if (error) throw error;
  return data;
}

async function deleteGolfer(golfer_id) {
  const { error } = await supabase.from('golf_golfers').delete().eq('id', golfer_id);
  if (error) throw error;
}

async function getGolfers(tournament_id) {
  const { data, error } = await supabase.from('golf_golfers').select('*').eq('tournament_id', tournament_id).order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function saveGolferOdds(tournament_id, golfer_id, kelly_round, category, american_odds) {
  const { data, error } = await supabase.from('golf_odds').upsert({
    tournament_id,
    golfer_id,
    kelly_round,
    category,
    american_odds,
    set_by: 'admin'
  }, { onConflict: 'tournament_id,golfer_id,kelly_round,category' });
  if (error) throw error;
  return data;
}

async function getOddsForGolfer(golfer_id, kelly_round) {
  const { data, error } = await supabase.from('golf_odds').select('*').eq('golfer_id', golfer_id).eq('kelly_round', kelly_round);
  if (error) throw error;
  const odds = {};
  (data || []).forEach(o => { odds[o.category] = o.american_odds; });
  return odds;
}

async function getPlayerBankrollsForRound(tournament_id, kelly_round) {
  const [usersRes, bankrollsRes, wagersRes] = await Promise.all([
    supabase.from('users').select('email, name, paid').eq('is_admin', false),
    supabase.from('golf_bankrolls').select('user_email, starting_points, points_remaining').eq('tournament_id', tournament_id).eq('kelly_round', kelly_round),
    supabase.from('golf_wagers').select('user_email').eq('tournament_id', tournament_id).eq('kelly_round', kelly_round),
  ]);
  if (usersRes.error) throw usersRes.error;

  const bankrollMap = {};
  (bankrollsRes.data || []).forEach(b => { bankrollMap[b.user_email] = b; });

  const wagerCounts = {};
  (wagersRes.data || []).forEach(w => { wagerCounts[w.user_email] = (wagerCounts[w.user_email] || 0) + 1; });

  return (usersRes.data || []).map(u => {
    const b = bankrollMap[u.email];
    return {
      user_id: u.email,
      email: u.email,
      name: u.name || 'Unknown',
      paid: u.paid || false,
      starting_points: b?.starting_points ?? 0,
      points_remaining: b?.points_remaining ?? 0,
      wager_count: wagerCounts[u.email] || 0,
    };
  });
}

async function ensureBankroll(tournament_id, kelly_round, user_id) {
  const { data: existing } = await supabase
    .from('golf_bankrolls')
    .select('id, starting_points, points_remaining')
    .eq('tournament_id', tournament_id)
    .eq('kelly_round', kelly_round)
    .eq('user_email', user_id)
    .maybeSingle();
  if (existing) return existing;

  const { data: setting } = await supabase.from('settings').select('value').eq('key', 'golf_starting_points').maybeSingle();
  const startPts = parseInt(setting?.value || '500');

  const { data, error } = await supabase
    .from('golf_bankrolls')
    .insert({ tournament_id, kelly_round, user_email: user_id, starting_points: startPts, points_remaining: startPts })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getWagersForRound(tournament_id, kelly_round) {
  const { data, error } = await supabase
    .from('golf_wagers')
    .select(`id, user_email, golfer_id, category, points_wagered, odds_at_time, result, points_won, created_at, golf_golfers(name)`)
    .eq('tournament_id', tournament_id)
    .eq('kelly_round', kelly_round)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // get user names
  const wagerEmails = (data || []).map(w => w.user_email);
  const uniqueEmails = [...new Set(wagerEmails)];
  const { data: users, error: usersErr } = await supabase.from('users').select('email, name').in('email', uniqueEmails);
  if (usersErr) throw usersErr;
  const userMap = {};
  (users || []).forEach(u => { userMap[u.email] = u.name; });
  return (data || []).map(w => ({ ...w, player_name: userMap[w.user_email] || 'Unknown' }));
}

export { placeWager, settleRound, upsertGolfers, upsertOdds, getTournament, getGolfersWithOdds, getUserWagers, getWagerLog, syncLeaderboardToGolfers, getLeaderboard, addGolfer, deleteGolfer, getGolfers, saveGolferOdds, getOddsForGolfer, getPlayerBankrollsForRound, getWagersForRound, ensureBankroll };
