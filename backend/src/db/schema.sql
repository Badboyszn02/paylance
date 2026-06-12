-- PayLance schema (PostgreSQL). Wallet-only auth via SIWE.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'freelancer', 'creator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'OFFER_SENT','NEGOTIATING','ACCEPTED','FUNDED','IN_PROGRESS',
    'DELIVERED','REVIEWING','COMPLETED','CANCELLED','DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text','offer','system','delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tx_type AS ENUM ('escrow','release','refund','fee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- users (wallet only) ----------
CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT,
  wallet_address TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'client',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- migrate from older email/password schema if present
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;
DELETE FROM users WHERE wallet_address IS NULL;
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN wallet_address SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_uniq ON users (lower(wallet_address));

-- ---------- auth nonces (SIWE) ----------
CREATE TABLE IF NOT EXISTS auth_nonces (
  wallet_address TEXT PRIMARY KEY,
  message        TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL
);

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  user_id                  BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company                  TEXT,
  bio                      TEXT,
  location                 TEXT,
  avatar_url               TEXT,
  wallet_address           TEXT,
  category                 TEXT,
  subcategories            TEXT[]  DEFAULT '{}',
  skills                   TEXT[]  DEFAULT '{}',
  portfolio_links          TEXT[]  DEFAULT '{}',
  niche                    TEXT,
  social_instagram         TEXT,
  social_tiktok            TEXT,
  social_youtube           TEXT,
  social_twitter           TEXT,
  social_verified          BOOLEAN DEFAULT FALSE,
  follower_count_instagram INTEGER DEFAULT 0,
  follower_count_tiktok    INTEGER DEFAULT 0,
  follower_count_youtube   INTEGER DEFAULT 0,
  follower_count_twitter   INTEGER DEFAULT 0,
  engagement_rate          NUMERIC(5,2) DEFAULT 0,
  rate_per_post_usdc       NUMERIC(14,2) DEFAULT 0,
  past_collaborations      TEXT[]  DEFAULT '{}',
  average_rating           NUMERIC(3,2) DEFAULT 0,
  review_count             INTEGER DEFAULT 0,
  completed_orders         INTEGER DEFAULT 0,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- listings ----------
CREATE TABLE IF NOT EXISTS listings (
  id            BIGSERIAL PRIMARY KEY,
  freelancer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT   NOT NULL,
  description   TEXT   NOT NULL,
  price_usdc    NUMERIC(14,2) NOT NULL CHECK (price_usdc >= 0),
  delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
  category      TEXT   NOT NULL,
  subcategory   TEXT,
  tags          TEXT[] DEFAULT '{}',
  status        TEXT   NOT NULL DEFAULT 'active',
  search_doc    TSVECTOR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION listings_search_doc() RETURNS trigger AS $$
BEGIN
  NEW.search_doc :=
    setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.tags,'{}'), ' ')), 'C');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_search_doc ON listings;
CREATE TRIGGER trg_listings_search_doc
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION listings_search_doc();

CREATE INDEX IF NOT EXISTS idx_listings_search   ON listings USING GIN (search_doc);
CREATE INDEX IF NOT EXISTS idx_listings_category  ON listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_price     ON listings (price_usdc);

-- On-chain proof of listing: hash committed and tx hash from ListingRegistry.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_hash TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tx_hash      TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_listings_hash ON listings (listing_hash) WHERE listing_hash IS NOT NULL;

-- kind: 'service' (provider offering) or 'job' (hirer looking). freelancer_id = owner either way.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'service';
CREATE INDEX IF NOT EXISTS idx_listings_kind ON listings (kind);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id                     BIGSERIAL PRIMARY KEY,
  client_id              BIGINT NOT NULL REFERENCES users(id),
  freelancer_id          BIGINT NOT NULL REFERENCES users(id),
  listing_id             BIGINT REFERENCES listings(id),
  amount_usdc            NUMERIC(14,2) NOT NULL,
  platform_fee_usdc      NUMERIC(14,2) NOT NULL DEFAULT 0,
  status                 order_status NOT NULL DEFAULT 'OFFER_SENT',
  escrow_contract_address TEXT,
  arc_tx_hash            TEXT,
  client_satisfied       BOOLEAN NOT NULL DEFAULT FALSE,
  freelancer_satisfied   BOOLEAN NOT NULL DEFAULT FALSE,
  client_cancelled       BOOLEAN NOT NULL DEFAULT FALSE,
  freelancer_cancelled   BOOLEAN NOT NULL DEFAULT FALSE,
  is_campaign            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at           TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_client     ON orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_freelancer ON orders (freelancer_id);

-- ---------- messages ----------
CREATE TABLE IF NOT EXISTS messages (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id    BIGINT REFERENCES users(id),
  content      TEXT,
  file_url     TEXT,
  message_type message_type NOT NULL DEFAULT 'text',
  meta         JSONB DEFAULT '{}',
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages (order_id, sent_at);

-- ---------- agreements (influencer) ----------
CREATE TABLE IF NOT EXISTS agreements (
  id               BIGSERIAL PRIMARY KEY,
  order_id         BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  deliverables     TEXT,
  platforms        TEXT[] DEFAULT '{}',
  num_posts        INTEGER DEFAULT 1,
  posting_dates    TEXT[] DEFAULT '{}',
  content_approval TEXT,
  usage_rights     TEXT,
  exclusivity_days INTEGER DEFAULT 0,
  budget_usdc      NUMERIC(14,2),
  signed_by_brand  BOOLEAN NOT NULL DEFAULT FALSE,
  signed_by_creator BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- campaigns ----------
CREATE TABLE IF NOT EXISTS campaigns (
  id            BIGSERIAL PRIMARY KEY,
  brand_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  deliverables  TEXT,
  platforms     TEXT[] DEFAULT '{}',
  posting_dates TEXT[] DEFAULT '{}',
  niche         TEXT,
  budget_usdc   NUMERIC(14,2),
  status        TEXT NOT NULL DEFAULT 'open',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- disputes ----------
CREATE TABLE IF NOT EXISTS disputes (
  id                    BIGSERIAL PRIMARY KEY,
  order_id              BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  raised_by             BIGINT REFERENCES users(id),
  reason                TEXT,
  status                TEXT NOT NULL DEFAULT 'open',
  admin_decision        TEXT,
  resolution_amount_usdc NUMERIC(14,2),
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- reviews ----------
CREATE TABLE IF NOT EXISTS reviews (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id BIGINT NOT NULL REFERENCES users(id),
  reviewee_id BIGINT NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, reviewer_id)
);

-- ---------- transactions ----------
CREATE TABLE IF NOT EXISTS transactions (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  arc_tx_hash TEXT,
  amount_usdc NUMERIC(14,2) NOT NULL,
  fee_usdc    NUMERIC(14,2) NOT NULL DEFAULT 0,
  type        tx_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tx_order ON transactions (order_id);
