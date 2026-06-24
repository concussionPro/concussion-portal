-- SST Trainer subscriptions — ISOLATED from the course `users`/access tables.
-- SST in-dashboard access is granted by an active row here; app-store users
-- (free, clinic-code) never touch this. Run once against the Neon DB.

CREATE TABLE IF NOT EXISTS sst_subscriptions (
  id                     TEXT PRIMARY KEY,
  email                  TEXT NOT NULL,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan                   TEXT,                 -- 'monthly' | 'annual'
  status                 TEXT NOT NULL,        -- Stripe sub status: active, trialing, past_due, canceled, unpaid, incomplete
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sst_subs_email  ON sst_subscriptions (lower(email));
CREATE INDEX IF NOT EXISTS idx_sst_subs_status ON sst_subscriptions (status);
