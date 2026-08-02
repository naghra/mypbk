-- Mithaq Islamic Marriage Platform — PostgreSQL schema + RLS
-- Compatible with Supabase Auth (auth.users)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('USER', 'ADMIN', 'MODERATOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('MALE', 'FEMALE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marital_status AS ENUM ('SINGLE', 'DIVORCED', 'WIDOWED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE religious_commitment AS ENUM ('PRACTICING', 'MODERATELY_PRACTICING', 'SEEKING_TO_IMPROVE', 'CULTURAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prayer_frequency AS ENUM ('FIVE_TIMES', 'MOST_PRAYERS', 'FRIDAY_ONLY', 'OCCASIONALLY', 'RARELY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE smoking_status AS ENUM ('NEVER', 'OCCASIONALLY', 'REGULARLY', 'QUIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE education_level AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE interest_action AS ENUM ('INTERESTED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_type AS ENUM ('GOVERNMENT_ID', 'SELFIE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM ('INAPPROPRIATE_CONTENT', 'HARASSMENT', 'FAKE_PROFILE', 'SPAM', 'EXPLICIT_CONTENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('FREE', 'PREMIUM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('NEW_MATCH', 'NEW_MESSAGE', 'NEW_LIKE', 'VERIFICATION_UPDATE', 'REPORT_UPDATE', 'SUBSCRIPTION', 'SYSTEM', 'PROFILE_VIEW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_moderation_status AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  role role NOT NULL DEFAULT 'USER',
  locale TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  last_active_at TIMESTAMPTZ,
  supabase_auth_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  gender gender NOT NULL,
  date_of_birth DATE NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  nationality TEXT NOT NULL,
  height_cm INT,
  weight_kg INT,
  education education_level,
  occupation TEXT,
  income TEXT,
  marital_status marital_status NOT NULL DEFAULT 'SINGLE',
  has_children BOOLEAN NOT NULL DEFAULT false,
  children_count INT NOT NULL DEFAULT 0,
  languages TEXT[] NOT NULL DEFAULT '{}',
  religious_commitment religious_commitment NOT NULL,
  prayer_frequency prayer_frequency NOT NULL,
  smoking smoking_status NOT NULL DEFAULT 'NEVER',
  bio TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_priority BOOLEAN NOT NULL DEFAULT false,
  personality_traits TEXT[] NOT NULL DEFAULT '{}',
  lifestyle_tags TEXT[] NOT NULL DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  fake_score DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_gender_country_city_idx ON profiles(gender, country, city);
CREATE INDEX IF NOT EXISTS profiles_visible_complete_idx ON profiles(is_visible, is_complete);
CREATE INDEX IF NOT EXISTS profiles_religious_idx ON profiles(religious_commitment);

CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  ai_fake_score DOUBLE PRECISION,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photos_user_id_idx ON photos(user_id);

CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  min_age INT NOT NULL DEFAULT 18,
  max_age INT NOT NULL DEFAULT 50,
  max_distance_km INT NOT NULL DEFAULT 100,
  countries TEXT[] NOT NULL DEFAULT '{}',
  cities TEXT[] NOT NULL DEFAULT '{}',
  education_levels education_level[] NOT NULL DEFAULT '{}',
  marital_statuses marital_status[] NOT NULL DEFAULT '{}',
  religious_commitments religious_commitment[] NOT NULL DEFAULT '{}',
  accept_children BOOLEAN,
  languages TEXT[] NOT NULL DEFAULT '{}',
  min_height_cm INT,
  max_height_cm INT,
  professions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action interest_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS interests_receiver_action_idx ON interests(receiver_id, action);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'MATCHED',
  compatibility_score DOUBLE PRECISION,
  unmatched_by_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS matches_user1_status_idx ON matches(user1_id, status);
CREATE INDEX IF NOT EXISTS matches_user2_status_idx ON matches(user2_id, status);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  moderation_status message_moderation_status NOT NULL DEFAULT 'PENDING',
  moderation_flags TEXT[] NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_match_created_idx ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'OPEN',
  resolved_by UUID,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_reported_idx ON reports(reported_id);

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'FREE',
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  likes_remaining INT NOT NULL DEFAULT 10,
  likes_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read, created_at);

CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'PENDING',
  document_url TEXT,
  selfie_url TEXT,
  ai_fake_score DOUBLE PRECISION,
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verifications_user_type_idx ON verifications(user_id, type);
CREATE INDEX IF NOT EXISTS verifications_status_idx ON verifications(status);

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_logs_admin_created_idx ON admin_logs(admin_id, created_at);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limit_key_idx ON rate_limit_buckets(key);

-- Storage buckets (run with service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('verification-docs', 'verification-docs', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Helper: resolve app user from JWT
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM users WHERE supabase_auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE supabase_auth_id = auth.uid()
      AND role IN ('ADMIN', 'MODERATOR')
      AND is_active = true
      AND is_banned = false
  );
$$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select_own ON users FOR SELECT
  USING (supabase_auth_id = auth.uid() OR public.is_admin());
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (supabase_auth_id = auth.uid() OR public.is_admin());

-- Profiles: visible complete profiles are readable; owners manage own
CREATE POLICY profiles_select_visible ON profiles FOR SELECT
  USING (
    public.is_admin()
    OR user_id = public.current_app_user_id()
    OR (is_visible = true AND is_complete = true AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = public.current_app_user_id() AND b.blocked_id = profiles.user_id)
         OR (b.blocked_id = public.current_app_user_id() AND b.blocker_id = profiles.user_id)
    ))
  );
CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (user_id = public.current_app_user_id() OR public.is_admin());

-- Photos
CREATE POLICY photos_select ON photos FOR SELECT
  USING (
    public.is_admin()
    OR user_id = public.current_app_user_id()
    OR (is_approved = true AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.user_id = photos.user_id AND p.is_visible AND p.is_complete
    ))
  );
CREATE POLICY photos_manage_own ON photos FOR ALL
  USING (user_id = public.current_app_user_id() OR public.is_admin())
  WITH CHECK (user_id = public.current_app_user_id() OR public.is_admin());

-- Preferences
CREATE POLICY preferences_own ON preferences FOR ALL
  USING (user_id = public.current_app_user_id() OR public.is_admin())
  WITH CHECK (user_id = public.current_app_user_id() OR public.is_admin());

-- Interests
CREATE POLICY interests_select ON interests FOR SELECT
  USING (sender_id = public.current_app_user_id() OR receiver_id = public.current_app_user_id() OR public.is_admin());
CREATE POLICY interests_insert ON interests FOR INSERT
  WITH CHECK (sender_id = public.current_app_user_id());

-- Matches
CREATE POLICY matches_select ON matches FOR SELECT
  USING (user1_id = public.current_app_user_id() OR user2_id = public.current_app_user_id() OR public.is_admin());
CREATE POLICY matches_update ON matches FOR UPDATE
  USING (user1_id = public.current_app_user_id() OR user2_id = public.current_app_user_id() OR public.is_admin());

-- Messages: only match participants; no disappearing messages by design
CREATE POLICY messages_select ON messages FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND m.status = 'MATCHED'
        AND (m.user1_id = public.current_app_user_id() OR m.user2_id = public.current_app_user_id())
    )
  );
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (
    sender_id = public.current_app_user_id()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.status = 'MATCHED'
        AND (m.user1_id = public.current_app_user_id() OR m.user2_id = public.current_app_user_id())
    )
  );
CREATE POLICY messages_update ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (m.user1_id = public.current_app_user_id() OR m.user2_id = public.current_app_user_id())
    )
    OR public.is_admin()
  );

-- Reports / blocks / notifications / subscriptions / verifications
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (reporter_id = public.current_app_user_id());
CREATE POLICY reports_select ON reports FOR SELECT
  USING (reporter_id = public.current_app_user_id() OR public.is_admin());
CREATE POLICY reports_admin_update ON reports FOR UPDATE
  USING (public.is_admin());

CREATE POLICY blocks_own ON blocks FOR ALL
  USING (blocker_id = public.current_app_user_id() OR public.is_admin())
  WITH CHECK (blocker_id = public.current_app_user_id() OR public.is_admin());

CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (user_id = public.current_app_user_id() OR public.is_admin());
CREATE POLICY subscriptions_admin ON subscriptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY notifications_own ON notifications FOR ALL
  USING (user_id = public.current_app_user_id() OR public.is_admin())
  WITH CHECK (user_id = public.current_app_user_id() OR public.is_admin());

CREATE POLICY verifications_own_select ON verifications FOR SELECT
  USING (user_id = public.current_app_user_id() OR public.is_admin());
CREATE POLICY verifications_own_insert ON verifications FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY verifications_admin_update ON verifications FOR UPDATE
  USING (public.is_admin());

CREATE POLICY admin_logs_admin ON admin_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage RLS
CREATE POLICY profile_photos_read ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');
CREATE POLICY profile_photos_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
CREATE POLICY profile_photos_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY profile_photos_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

CREATE POLICY verification_docs_own ON storage.objects FOR ALL
  USING (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Realtime for messages & notifications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
