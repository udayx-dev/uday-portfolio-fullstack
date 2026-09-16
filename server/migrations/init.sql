-- Uday Portfolio — initial schema
-- Safe to run multiple times (IF NOT EXISTS everywhere).

CREATE TABLE IF NOT EXISTS messages (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  subject       VARCHAR(160),
  message       TEXT          NOT NULL,
  source        VARCHAR(20)   NOT NULL DEFAULT 'contact_form'
                  CHECK (source IN ('contact_form', 'chatbot')),
  status        VARCHAR(20)   NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'in_progress', 'closed')),
  is_read       BOOLEAN       NOT NULL DEFAULT FALSE,
  email_sent    BOOLEAN       NOT NULL DEFAULT FALSE,
  ip_hash       VARCHAR(64),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_source ON messages (source);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages (is_read);

CREATE TABLE IF NOT EXISTS call_requests (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  preferred_date  VARCHAR(60),
  preferred_time  VARCHAR(60),
  timezone        VARCHAR(60),
  reason          TEXT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),
  is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
  email_sent      BOOLEAN      NOT NULL DEFAULT FALSE,
  ip_hash         VARCHAR(64),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_requests_created_at ON call_requests (created_at DESC);

-- Lightweight, privacy-conscious analytics: counts of named events only.
-- No IPs, emails, or message content are ever written here.
CREATE TABLE IF NOT EXISTS analytics_events (
  id          SERIAL PRIMARY KEY,
  event_name  VARCHAR(60)  NOT NULL,
  meta        VARCHAR(160),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events (event_name, created_at DESC);
