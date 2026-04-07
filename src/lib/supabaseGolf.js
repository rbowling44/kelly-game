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

export { placeWager, settleRound, upsertGolfers, upsertOdds, getTournament, getGolfersWithOdds, getUserWagers, getWagerLog, syncLeaderboardToGolfers, getLeaderboard };
