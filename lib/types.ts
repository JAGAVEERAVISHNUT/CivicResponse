export type UserRole = 'citizen' | 'l1_officer' | 'l2_officer' | 'admin';
export type IssueStatus = 'submitted' | 'assigned_l1' | 'assigned_l2' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueCategory = 'pothole' | 'streetlight' | 'garbage' | 'water_supply' | 'sewage' | 'traffic' | 'park' | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  latitude: number;
  longitude: number;
  address?: string;
  reporter_id: string;
  assigned_l1_id?: string;
  assigned_l2_id?: string;
  created_at: string;
  updated_at: string;
  assigned_l1_at?: string;
  assigned_l2_at?: string;
  resolved_at?: string;
  closed_at?: string;
  sla_deadline?: string;
  escalation_count: number;
  images: string[];
  reporter?: Profile;
  assigned_l1?: Profile;
  assigned_l2?: Profile;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  user?: Profile;
}

export interface ActivityLog {
  id: string;
  issue_id: string;
  user_id?: string;
  action: string;
  details: any;
  created_at: string;
  user?: Profile;
}

export interface PromotionRequest {
  id: string;
  user_id: string;
  requested_by: string;
  from_role: string;
  to_role: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
  requester?: Profile;
}
