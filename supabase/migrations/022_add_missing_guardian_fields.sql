-- Migration: Add missing infrastructure for Care Guardian feature
-- Fixes several "Broken" states identified during the audit

-- 1. Add connection-specific columns to dependents
ALTER TABLE dependents 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invitation_status text CHECK (invitation_status IN ('none', 'sent', 'claimed', 'declined')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone;

COMMENT ON COLUMN dependents.linked_user_id IS 'Link to an existing user account who has authorized access';

-- 2. Create connection_verifications table for OTP-based account linking
CREATE TABLE IF NOT EXISTS connection_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_user_id uuid REFERENCES auth.users(id) NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on verification table
ALTER TABLE connection_verifications ENABLE ROW LEVEL SECURITY;

-- Verification logic: Only the target can see their codes, or the sender who created it
CREATE POLICY "Users can view their own verification requests" 
ON connection_verifications 
FOR SELECT USING (auth.uid() = target_user_id OR auth.uid() = sender_user_id);

CREATE POLICY "Users can insert verification requests" 
ON connection_verifications 
FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

-- 3. Update indexes
CREATE INDEX IF NOT EXISTS dependents_linked_user_idx ON dependents(linked_user_id);
CREATE INDEX IF NOT EXISTS connection_verifications_target_idx ON connection_verifications(target_user_id);
