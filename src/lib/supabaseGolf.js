import { supabase } from './supabaseClient.js';
import { fetchLeaderboard } from './datagolf';

async function placeWager({ tournament_id, kelly_round, user_id, golfer_id, category, points_wagered, odds_at_time }) {
  const { data, error } = await supabase.rpc('golf_place_wager', {
    p_tournament_id: tournament_id,
    p_kelly_round: kelly_round,
    p_user_id: user_id,
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

async function getUserWagers(user_id, tournament_id) {
  const { data, error } = await supabase.from('golf_wagers').select('*, golf_golfers(name)').eq('user_id', user_id).eq('tournament_id', tournament_id).order('created_at', { ascending: false });
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
  // Aggregate points from golf_wagers per user to present leaderboard across rounds
  const { data, error } = await supabase.rpc('get_golf_leaderboard', { p_tournament_id: tournament_id }).catch(() => ({ data: null, error: null }));
  if (error) throw error;
  if (data) return data;
  // fallback: compute from golf_wagers
  const { data: rows, error: e2 } = await supabase.from('golf_wagers').select('user_id, points_won').eq('tournament_id', tournament_id);
  if (e2) throw e2;
  const agg = {};
  for (const r of rows || []) {
    agg[r.user_id] = (agg[r.user_id] || 0) + (r.points_won || 0);
  }
  return Object.entries(agg).map(([user_id, points]) => ({ user_id, points }));
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
  const { data: users, error: usersErr } = await supabase.from('users').select('email, name');
  if (usersErr) throw usersErr;
  const { data: bankrolls, error: bErr } = await supabase.from('golf_bankrolls').select('*').eq('tournament_id', tournament_id).eq('kelly_round', kelly_round);
  if (bErr) throw bErr;
  const { data: wagers, error: wErr } = await supabase.from('golf_wagers').select('user_id').eq('tournament_id', tournament_id).eq('kelly_round', kelly_round);
  if (wErr) throw wErr;
  // count wagers per user
  const wagerCounts = {};
  (wagers || []).forEach(w => { wagerCounts[w.user_id] = (wagerCounts[w.user_id] || 0) + 1; });
  // merge
  return (users || []).map(u => {
    const bankroll = (bankrolls || []).find(b => b.user_id === u.email);
    return {
      user_id: u.email,
      email: u.email,
      name: u.name,
      starting_points: bankroll?.starting_points || 0,
      points_remaining: bankroll?.points_remaining || 0,
      wager_count: wagerCounts[u.email] || 0
    };
  });
}

async function ensureBankroll(tournament_id, kelly_round, user_id) {
  const { data: existing } = await supabase
    .from('golf_bankrolls')
    .select('id, starting_points, points_remaining')
    .eq('tournament_id', tournament_id)
    .eq('kelly_round', kelly_round)
    .eq('user_id', user_id)
    .maybeSingle();
  if (existing) return existing;

  const { data: setting } = await supabase.from('settings').select('value').eq('key', 'golf_starting_points').maybeSingle();
  const startPts = parseInt(setting?.value || '500');

  const { data, error } = await supabase
    .from('golf_bankrolls')
    .insert({ tournament_id, kelly_round, user_id, starting_points: startPts, points_remaining: startPts })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getWagersForRound(tournament_id, kelly_round) {
  const { data, error } = await supabase
    .from('golf_wagers')
    .select(`id, user_id, golfer_id, category, points_wagered, odds_at_time, result, points_won, created_at, golf_golfers(name)`)
    .eq('tournament_id', tournament_id)
    .eq('kelly_round', kelly_round)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // get user names
  const wagerIds = (data || []).map(w => w.user_id);
  const uniqueUserIds = [...new Set(wagerIds)];
  const { data: users, error: usersErr } = await supabase.from('users').select('email, name').in('email', uniqueUserIds);
  if (usersErr) throw usersErr;
  const userMap = {};
  (users || []).forEach(u => { userMap[u.email] = u.name; });
  return (data || []).map(w => ({ ...w, player_name: userMap[w.user_id] || 'Unknown' }));
}

export { placeWager, settleRound, upsertGolfers, upsertOdds, getTournament, getGolfersWithOdds, getUserWagers, getWagerLog, syncLeaderboardToGolfers, getLeaderboard, addGolfer, deleteGolfer, getGolfers, saveGolferOdds, getOddsForGolfer, getPlayerBankrollsForRound, getWagersForRound, ensureBankroll };
