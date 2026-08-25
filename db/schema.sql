CREATE TABLE IF NOT EXISTS tracked_bounty (
  bounty_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  last_status TEXT NOT NULL,
  thresholds_notified INTEGER[] NOT NULL DEFAULT '{}',
  budget_bar_comment_id TEXT,
  post_mortem_posted BOOLEAN NOT NULL DEFAULT FALSE,
  auto_post_mortem BOOLEAN NOT NULL DEFAULT TRUE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'pro'))
);

CREATE TABLE IF NOT EXISTS creator_settings (
  account_id TEXT PRIMARY KEY,
  threshold_pcts INTEGER[] NOT NULL DEFAULT '{20}'
);
