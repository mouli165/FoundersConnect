/*
# FoundersConnect Initial Schema

## Overview
This migration creates the core schema for FoundersConnect - a platform where builders find teammates for startups, hackathons, side projects, open-source work, and research.

## New Tables

### builder_profiles
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users, unique)
- `name` (text, not null)
- `photo_url` (text, nullable)
- `location` (text, nullable)
- `primary_role` (text, not null)
- `secondary_roles` (text[], default '{}')
- `skills` (text[], not null, default '{}')
- `project_interests` (text[], default '{}')
- `availability` (text, enum: 'few_hours', 'ten_plus_hours', 'full_time')
- `commitment_type` (text, enum: 'weekend', 'few_months', 'long_term', 'open_ended')
- `looking_for_roles` (text[], default '{}')
- `looking_for_project_type` (text, nullable)
- `about_me` (text, nullable, max 500 chars)
- `github_url` (text, nullable)
- `linkedin_url` (text, nullable)
- `portfolio_url` (text, nullable)
- `onboarding_completed` (boolean, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### past_projects
- `id` (uuid, primary key)
- `profile_id` (uuid, references builder_profiles)
- `title` (text, not null)
- `description` (text, nullable)
- `link` (text, nullable)
- `shipped` (boolean, default false)
- `created_at` (timestamptz, default now())

### connect_requests
- `id` (uuid, primary key)
- `sender_id` (uuid, references auth.users)
- `recipient_id` (uuid, references auth.users)
- `note` (text, not null, min 10 chars)
- `status` (text, enum: 'pending', 'accepted', 'declined', 'withdrawn')
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### matches
- `id` (uuid, primary key)
- `user_a_id` (uuid, references auth.users)
- `user_b_id` (uuid, references auth.users)
- `created_at` (timestamptz, default now())
- Unique constraint on (user_a_id, user_b_id)

### conversations
- `id` (uuid, primary key)
- `match_id` (uuid, references matches)
- `created_at` (timestamptz, default now())

### messages
- `id` (uuid, primary key)
- `conversation_id` (uuid, references conversations)
- `sender_id` (uuid, references auth.users)
- `body` (text, not null)
- `sent_at` (timestamptz, default now())
- `read_at` (timestamptz, nullable)

### notifications
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `type` (text, enum: 'connect_request_received', 'connect_request_accepted', 'new_message')
- `payload` (jsonb, nullable)
- `read` (boolean, default false)
- `created_at` (timestamptz, default now())

### blocked_users
- `id` (uuid, primary key)
- `blocker_id` (uuid, references auth.users)
- `blocked_id` (uuid, references auth.users)
- `created_at` (timestamptz, default now())
- Unique constraint on (blocker_id, blocked_id)

### reported_users
- `id` (uuid, primary key)
- `reporter_id` (uuid, references auth.users)
- `reported_id` (uuid, references auth.users)
- `reason` (text, not null)
- `details` (text, nullable)
- `created_at` (timestamptz, default now())

## Security (RLS)
- All tables have RLS enabled
- Policies are scoped to authenticated users
- Owner-based access control for personal data
- Match-based access control for messages
- User-based access for notifications

## Notes
1. All user_id columns default to auth.uid() for seamless inserts
2. Skills, roles, and interests use text arrays for structured multi-select
3. Proper indexes for common query patterns
*/

-- Create enums
CREATE TYPE availability_enum AS ENUM ('few_hours', 'ten_plus_hours', 'full_time');
CREATE TYPE commitment_enum AS ENUM ('weekend', 'few_months', 'long_term', 'open_ended');
CREATE TYPE request_status_enum AS ENUM ('pending', 'accepted', 'declined', 'withdrawn');
CREATE TYPE notification_type_enum AS ENUM ('connect_request_received', 'connect_request_accepted', 'new_message');

-- Builder Profiles table
CREATE TABLE IF NOT EXISTS builder_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text NOT NULL,
  photo_url text,
  location text,
  primary_role text NOT NULL,
  secondary_roles text[] DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  project_interests text[] DEFAULT '{}',
  availability availability_enum,
  commitment_type commitment_enum,
  looking_for_roles text[] DEFAULT '{}',
  looking_for_project_type text,
  about_me text CHECK (char_length(about_me) <= 500),
  github_url text,
  linkedin_url text,
  portfolio_url text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE builder_profiles ENABLE ROW LEVEL SECURITY;

-- Past Projects table
CREATE TABLE IF NOT EXISTS past_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES builder_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  link text,
  shipped boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE past_projects ENABLE ROW LEVEL SECURITY;

-- Connect Requests table
CREATE TABLE IF NOT EXISTS connect_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (char_length(note) >= 10),
  status request_status_enum NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, recipient_id)
);

ALTER TABLE connect_requests ENABLE ROW LEVEL SECURITY;

-- Matches table (created when connect request is accepted)
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id != user_b_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Blocked Users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Reported Users table
CREATE TABLE IF NOT EXISTS reported_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reported_users ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_builder_profiles_user_id ON builder_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_profiles_skills ON builder_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_builder_profiles_availability ON builder_profiles(availability);
CREATE INDEX IF NOT EXISTS idx_builder_profiles_commitment ON builder_profiles(commitment_type);
CREATE INDEX IF NOT EXISTS idx_past_projects_profile_id ON past_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_connect_requests_sender ON connect_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connect_requests_recipient ON connect_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connect_requests_status ON connect_requests(status);
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_match ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- RLS Policies for builder_profiles
DROP POLICY IF EXISTS "profiles_select_own" ON builder_profiles;
CREATE POLICY "profiles_select_own" ON builder_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON builder_profiles;
CREATE POLICY "profiles_insert_own" ON builder_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON builder_profiles;
CREATE POLICY "profiles_update_own" ON builder_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON builder_profiles;
CREATE POLICY "profiles_delete_own" ON builder_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for past_projects (accessible through profile ownership)
DROP POLICY IF EXISTS "past_projects_select" ON past_projects;
CREATE POLICY "past_projects_select" ON past_projects FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM builder_profiles WHERE builder_profiles.id = past_projects.profile_id)
  );

DROP POLICY IF EXISTS "past_projects_insert_own" ON past_projects;
CREATE POLICY "past_projects_insert_own" ON past_projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM builder_profiles WHERE builder_profiles.id = past_projects.profile_id AND builder_profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "past_projects_update_own" ON past_projects;
CREATE POLICY "past_projects_update_own" ON past_projects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM builder_profiles WHERE builder_profiles.id = past_projects.profile_id AND builder_profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "past_projects_delete_own" ON past_projects;
CREATE POLICY "past_projects_delete_own" ON past_projects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM builder_profiles WHERE builder_profiles.id = past_projects.profile_id AND builder_profiles.user_id = auth.uid())
  );

-- RLS Policies for connect_requests
DROP POLICY IF EXISTS "requests_select_involved" ON connect_requests;
CREATE POLICY "requests_select_involved" ON connect_requests FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "requests_insert_sender" ON connect_requests;
CREATE POLICY "requests_insert_sender" ON connect_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "requests_update_involved" ON connect_requests;
CREATE POLICY "requests_update_involved" ON connect_requests FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS Policies for matches (users can see matches they're part of)
DROP POLICY IF EXISTS "matches_select_participant" ON matches;
CREATE POLICY "matches_select_participant" ON matches FOR SELECT
  TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- RLS Policies for conversations (through match membership)
DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = conversations.match_id 
      AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

-- RLS Policies for messages (through conversation/match membership)
DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN matches ON matches.id = conversations.match_id
      WHERE conversations.id = messages.conversation_id
      AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN matches ON matches.id = conversations.match_id
      WHERE conversations.id = messages.conversation_id
      AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
    )
    AND auth.uid() = sender_id
  );

-- RLS Policies for notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for blocked_users
DROP POLICY IF EXISTS "blocked_select_own" ON blocked_users;
CREATE POLICY "blocked_select_own" ON blocked_users FOR SELECT
  TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "blocked_insert_blocker" ON blocked_users;
CREATE POLICY "blocked_insert_blocker" ON blocked_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_delete_blocker" ON blocked_users;
CREATE POLICY "blocked_delete_blocker" ON blocked_users FOR DELETE
  TO authenticated USING (auth.uid() = blocker_id);

-- RLS Policies for reported_users
DROP POLICY IF EXISTS "reports_select_reporter" ON reported_users;
CREATE POLICY "reports_select_reporter" ON reported_users FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_insert_reporter" ON reported_users;
CREATE POLICY "reports_insert_reporter" ON reported_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_builder_profiles_updated_at ON builder_profiles;
CREATE TRIGGER update_builder_profiles_updated_at
  BEFORE UPDATE ON builder_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connect_requests_updated_at ON connect_requests;
CREATE TRIGGER update_connect_requests_updated_at
  BEFORE UPDATE ON connect_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle match creation when request is accepted
CREATE OR REPLACE FUNCTION handle_connect_accept()
RETURNS TRIGGER AS $$
DECLARE
  match_id uuid;
  lower_id uuid;
  higher_id uuid;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Ensure consistent ordering for unique constraint
    IF NEW.sender_id < NEW.recipient_id THEN
      lower_id := NEW.sender_id;
      higher_id := NEW.recipient_id;
    ELSE
      lower_id := NEW.recipient_id;
      higher_id := NEW.sender_id;
    END IF;
    
    -- Create match
    INSERT INTO matches (user_a_id, user_b_id)
    VALUES (lower_id, higher_id)
    RETURNING id INTO match_id;
    
    -- Create conversation
    INSERT INTO conversations (match_id)
    VALUES (match_id);
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_connect_accept ON connect_requests;
CREATE TRIGGER trigger_connect_accept
  AFTER UPDATE ON connect_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_connect_accept();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  notify_user_id uuid,
  notify_type notification_type_enum,
  notify_payload jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, payload)
  VALUES (notify_user_id, notify_type, notify_payload);
END;
$$ language 'plpgsql';

-- Trigger for new connect request notification
CREATE OR REPLACE FUNCTION notify_connect_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM create_notification(
      NEW.recipient_id,
      'connect_request_received'::notification_type_enum,
      jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_notify_request ON connect_requests;
CREATE TRIGGER trigger_notify_request
  AFTER INSERT ON connect_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connect_request();

-- Trigger for request accepted notification
CREATE OR REPLACE FUNCTION notify_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.sender_id,
      'connect_request_accepted'::notification_type_enum,
      jsonb_build_object('recipient_id', NEW.recipient_id, 'request_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_notify_accepted ON connect_requests;
CREATE TRIGGER trigger_notify_accepted
  AFTER UPDATE ON connect_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_request_accepted();
