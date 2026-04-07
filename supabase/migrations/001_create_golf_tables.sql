-- Migration: create golf mode tables for The Masters Kelly Game
-- Creates tournaments, golfers, odds, wagers, and bankrolls tables

CREATE TABLE IF NOT EXISTS golf_tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    year INT NOT NULL,
    status VARCHAR(32) DEFAULT 'upcoming', -- upcoming | in_progress | completed
    active_kelly_round SMALLINT DEFAULT 1,
    mode VARCHAR(32) DEFAULT 'masters',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS golf_golfers (
    id SERIAL PRIMARY KEY,
    tournament_id INT NOT NULL REFERENCES golf_tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    datagolf_id TEXT,
    made_cut BOOLEAN DEFAULT TRUE,
    final_position INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS golf_odds (
    id SERIAL PRIMARY KEY,
    tournament_id INT NOT NULL REFERENCES golf_tournaments(id) ON DELETE CASCADE,
    kelly_round SMALLINT NOT NULL,
    golfer_id INT NOT NULL REFERENCES golf_golfers(id) ON DELETE CASCADE,
    category VARCHAR(16) NOT NULL, -- leader | top5 | top10
    american_odds TEXT NOT NULL,
    set_by VARCHAR(32) DEFAULT 'commissioner', -- auto | commissioner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golf_odds_tournament_round ON golf_odds (tournament_id, kelly_round);

CREATE TABLE IF NOT EXISTS golf_wagers (
    id SERIAL PRIMARY KEY,
    tournament_id INT NOT NULL REFERENCES golf_tournaments(id) ON DELETE CASCADE,
    kelly_round SMALLINT NOT NULL,
    user_id UUID NOT NULL,
    golfer_id INT NOT NULL REFERENCES golf_golfers(id) ON DELETE CASCADE,
    category VARCHAR(16) NOT NULL, -- leader | top5 | top10
    points_wagered INT NOT NULL,
    odds_at_time TEXT NOT NULL,
    result VARCHAR(16) DEFAULT 'pending', -- pending | won | lost
    points_won INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golf_wagers_user ON golf_wagers (user_id);
CREATE INDEX IF NOT EXISTS idx_golf_wagers_tournament_round ON golf_wagers (tournament_id, kelly_round);

CREATE TABLE IF NOT EXISTS golf_bankrolls (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tournament_id INT NOT NULL REFERENCES golf_tournaments(id) ON DELETE CASCADE,
    kelly_round SMALLINT NOT NULL,
    starting_points INT NOT NULL DEFAULT 500,
    points_remaining INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golf_bankrolls_user ON golf_bankrolls (user_id);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_golf_tournaments_updated_at BEFORE UPDATE ON golf_tournaments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_golf_golfers_updated_at BEFORE UPDATE ON golf_golfers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_golf_odds_updated_at BEFORE UPDATE ON golf_odds
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_golf_wagers_updated_at BEFORE UPDATE ON golf_wagers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_golf_bankrolls_updated_at BEFORE UPDATE ON golf_bankrolls
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
