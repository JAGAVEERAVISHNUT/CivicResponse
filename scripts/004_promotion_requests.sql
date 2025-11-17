-- Create promotion requests table
CREATE TABLE IF NOT EXISTS promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for promotion requests
ALTER TABLE promotion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own promotion requests
CREATE POLICY "Users can view their own promotion requests"
  ON promotion_requests FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all promotion requests
CREATE POLICY "Admins can view all promotion requests"
  ON promotion_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create promotion requests
CREATE POLICY "Admins can create promotion requests"
  ON promotion_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can update their own promotion requests (to accept/reject)
CREATE POLICY "Users can update their own promotion requests"
  ON promotion_requests FOR UPDATE
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promotion_requests_user_id ON promotion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_requests_status ON promotion_requests(status);
