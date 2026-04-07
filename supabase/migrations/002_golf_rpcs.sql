-- RPCs and helpers for Golf Mode: placing wagers and settling rounds

-- Ensure unique constraint for upserts on bankrolls
ALTER TABLE IF EXISTS golf_bankrolls ADD COLUMN IF NOT EXISTS uniq_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_golf_bankrolls_user_tournament_round ON golf_bankrolls (user_id, tournament_id, kelly_round);

-- Place a wager: inserts a wager and deducts points from the user's bankroll for that round
CREATE OR REPLACE FUNCTION golf_place_wager(
  p_tournament_id INT,
  p_kelly_round SMALLINT,
  p_user_id UUID,
  p_golfer_id INT,
  p_category VARCHAR,
  p_points_wagered INT,
  p_odds_at_time TEXT
) RETURNS TABLE(id INT, result TEXT) AS $$
DECLARE
  cur_points INT;
  b_exists INT;
BEGIN
  -- ensure bankroll exists for this user/round
  SELECT COUNT(*) INTO b_exists FROM golf_bankrolls WHERE user_id = p_user_id AND tournament_id = p_tournament_id AND kelly_round = p_kelly_round;
  IF b_exists = 0 THEN
    IF p_kelly_round = 1 THEN
      INSERT INTO golf_bankrolls (user_id, tournament_id, kelly_round, starting_points, points_remaining)
      VALUES (p_user_id, p_tournament_id, p_kelly_round, 500, 500);
    ELSE
      INSERT INTO golf_bankrolls (user_id, tournament_id, kelly_round, starting_points, points_remaining)
      VALUES (p_user_id, p_tournament_id, p_kelly_round, 0, 0);
    END IF;
  END IF;

  SELECT points_remaining INTO cur_points FROM golf_bankrolls WHERE user_id = p_user_id AND tournament_id = p_tournament_id AND kelly_round = p_kelly_round FOR UPDATE;
  IF cur_points IS NULL THEN
    RAISE EXCEPTION 'Bankroll not found';
  END IF;
  IF cur_points < p_points_wagered THEN
    RAISE EXCEPTION 'Insufficient bankroll points';
  END IF;

  UPDATE golf_bankrolls SET points_remaining = points_remaining - p_points_wagered WHERE user_id = p_user_id AND tournament_id = p_tournament_id AND kelly_round = p_kelly_round;

  INSERT INTO golf_wagers (tournament_id, kelly_round, user_id, golfer_id, category, points_wagered, odds_at_time, result)
  VALUES (p_tournament_id, p_kelly_round, p_user_id, p_golfer_id, p_category, p_points_wagered, p_odds_at_time, 'pending')
  RETURNING id, result INTO id, result;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Settle a kelly round: compute winners based on golf_golfers.final_position and made_cut
CREATE OR REPLACE FUNCTION golf_settle_round(p_tournament_id INT, p_kelly_round SMALLINT)
RETURNS TABLE(user_id UUID, total_points_won INT) AS $$
DECLARE
  rec RECORD;
  leader_pos INT;
  top5_cutoff INT;
  top10_cutoff INT;
  w RECORD;
  multiplier NUMERIC;
  odds_num INT;
  points_returned INT;
BEGIN
  -- determine leader position (lowest final_position)
  SELECT MIN(final_position) INTO leader_pos FROM golf_golfers WHERE tournament_id = p_tournament_id AND final_position IS NOT NULL;

  -- determine top5 and top10 cutoff positions while handling ties
  SELECT MAX(final_position) INTO top5_cutoff FROM golf_golfers WHERE tournament_id = p_tournament_id AND final_position IS NOT NULL AND final_position <= 5;
  SELECT MAX(final_position) INTO top10_cutoff FROM golf_golfers WHERE tournament_id = p_tournament_id AND final_position IS NOT NULL AND final_position <= 10;

  IF leader_pos IS NULL THEN
    RAISE NOTICE 'No final positions present for tournament %, round %', p_tournament_id, p_kelly_round;
  END IF;

  FOR w IN SELECT * FROM golf_wagers WHERE tournament_id = p_tournament_id AND kelly_round = p_kelly_round AND result = 'pending' LOOP
    -- get golfer result
    SELECT made_cut, final_position INTO rec.made_cut, rec.final_position FROM golf_golfers WHERE id = w.golfer_id;

    IF rec.made_cut IS NULL OR rec.made_cut = false THEN
      -- missed cut -> lost
      UPDATE golf_wagers SET result = 'lost', points_won = 0 WHERE id = w.id;
      CONTINUE;
    END IF;

    -- determine winner by category
    IF w.category = 'leader' THEN
      IF rec.final_position = leader_pos THEN
        -- win
      ELSE
        UPDATE golf_wagers SET result = 'lost', points_won = 0 WHERE id = w.id;
        CONTINUE;
      END IF;
    ELSIF w.category = 'top5' THEN
      IF top5_cutoff IS NULL OR rec.final_position IS NULL OR rec.final_position > top5_cutoff THEN
        UPDATE golf_wagers SET result = 'lost', points_won = 0 WHERE id = w.id;
        CONTINUE;
      END IF;
    ELSIF w.category = 'top10' THEN
      IF top10_cutoff IS NULL OR rec.final_position IS NULL OR rec.final_position > top10_cutoff THEN
        UPDATE golf_wagers SET result = 'lost', points_won = 0 WHERE id = w.id;
        CONTINUE;
      END IF;
    ELSE
      -- unknown category -> mark lost
      UPDATE golf_wagers SET result = 'lost', points_won = 0 WHERE id = w.id;
      CONTINUE;
    END IF;

    -- compute payout from stored odds_at_time (american odds as text like +150 or -120)
    BEGIN
      odds_num := CAST(regexp_replace(w.odds_at_time, '[^0-9-+]','', 'g') AS INT);
    EXCEPTION WHEN others THEN
      odds_num := NULL;
    END;

    IF odds_num IS NULL THEN
      multiplier := 1; -- fallback: return stake only
    ELSIF odds_num > 0 THEN
      multiplier := 1 + (odds_num::NUMERIC / 100);
    ELSE
      multiplier := 1 + (100::NUMERIC / abs(odds_num));
    END IF;

    points_returned := CEIL(w.points_wagered * multiplier);

    UPDATE golf_wagers SET result = 'won', points_won = points_returned WHERE id = w.id;
  END LOOP;

  -- compute totals per user and create bankroll for next round (use winnings only)
  FOR rec IN SELECT user_id, COALESCE(SUM(points_won),0) AS total FROM golf_wagers WHERE tournament_id = p_tournament_id AND kelly_round = p_kelly_round GROUP BY user_id LOOP
    -- delete any existing bankroll for next round for this user
    DELETE FROM golf_bankrolls WHERE user_id = rec.user_id AND tournament_id = p_tournament_id AND kelly_round = p_kelly_round + 1;
    INSERT INTO golf_bankrolls (user_id, tournament_id, kelly_round, starting_points, points_remaining)
    VALUES (rec.user_id, p_tournament_id, p_kelly_round + 1, rec.total, rec.total);
    RETURN NEXT rec.user_id, rec.total;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
