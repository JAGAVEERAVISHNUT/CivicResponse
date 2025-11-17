-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for issue status and priority
CREATE TYPE issue_status AS ENUM ('submitted', 'assigned_l1', 'assigned_l2', 'in_progress', 'resolved', 'closed', 'escalated');
CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE user_role AS ENUM ('citizen', 'l1_officer', 'l2_officer', 'admin');
CREATE TYPE issue_category AS ENUM ('pothole', 'streetlight', 'garbage', 'water_supply', 'sewage', 'traffic', 'park', 'other');

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'citizen',
  department TEXT, -- for officers/admins
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues table
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category issue_category NOT NULL,
  status issue_status DEFAULT 'submitted',
  priority issue_priority DEFAULT 'medium',
  
  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  
  -- User references
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_l1_id UUID REFERENCES auth.users(id),
  assigned_l2_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_l1_at TIMESTAMPTZ,
  assigned_l2_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- SLA tracking
  sla_deadline TIMESTAMPTZ,
  escalation_count INT DEFAULT 0,
  
  -- Image URLs (JSON array of image URLs)
  images JSONB DEFAULT '[]'::jsonb
);

-- Comments/Updates table
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- internal comments only visible to officers/admins
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON public.issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_l1 ON public.issues(assigned_l1_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_l2 ON public.issues(assigned_l2_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON public.issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_issue ON public.activity_log(issue_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
