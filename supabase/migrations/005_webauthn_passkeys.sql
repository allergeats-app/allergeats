-- 005_webauthn_passkeys.sql
-- Stores passkey (WebAuthn) credentials for Face ID / Touch ID / biometric sign-in.

-- Registered passkey credentials (one per device per user)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  credential_id text        UNIQUE NOT NULL,
  public_key    text        NOT NULL,
  counter       bigint      NOT NULL DEFAULT 0,
  device_type   text        NOT NULL DEFAULT 'singleDevice',
  backed_up     boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webauthn_credentials_user_id_idx ON webauthn_credentials (user_id);
CREATE INDEX IF NOT EXISTS webauthn_credentials_email_idx   ON webauthn_credentials (email);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials (for the profile page UI)
CREATE POLICY "users view own passkeys"
  ON webauthn_credentials FOR SELECT
  USING (auth.uid() = user_id);

-- All writes go through the service-role API routes only (no client-side inserts)

-- Short-lived challenges for in-progress registration / authentication ceremonies
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge  text        UNIQUE NOT NULL,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed — only accessed via service-role from API routes
