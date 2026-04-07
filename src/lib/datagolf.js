const BASE_URL = 'https://feeds.datagolf.com';

function ensureKey() {
  const key = import.meta.env.VITE_DATAGOLF_API_KEY;
  if (!key) throw new Error('VITE_DATAGOLF_API_KEY is not set in environment');
  return key;
}

async function fetchOutrights(market) {
  const key = ensureKey();
  const url = `${BASE_URL}/betting-tools/outrights?tour=pga&market=${encodeURIComponent(
    market
  )}&odds_format=american&file_format=json&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Data Golf outrights fetch failed: ${res.status}`);
  return res.json();
}

async function fetchLeaderboard() {
  const key = ensureKey();
  const url = `${BASE_URL}/field-updates?tour=pga&file_format=json&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Data Golf leaderboard fetch failed: ${res.status}`);
  return res.json();
}

export { fetchOutrights, fetchLeaderboard };
