export type Availability = 'few_hours' | 'ten_plus_hours' | 'full_time';
export type CommitmentType = 'weekend' | 'few_months' | 'long_term' | 'open_ended';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';
export type NotificationType = 'connect_request_received' | 'connect_request_accepted' | 'new_message';

export interface BuilderProfile {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  location: string | null;
  primary_role: string;
  secondary_roles: string[];
  skills: string[];
  project_interests: string[];
  availability: Availability | null;
  commitment_type: CommitmentType | null;
  looking_for_roles: string[];
  looking_for_project_type: string | null;
  about_me: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PastProject {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  link: string | null;
  shipped: boolean;
  created_at: string;
}

export interface ConnectRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  note: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  sender_profile?: BuilderProfile;
  recipient_profile?: BuilderProfile;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  other_profile?: BuilderProfile;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  match?: Match;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  sent_at: string;
  read_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ReportedUser {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}

// Filter types
export interface FeedFilters {
  skills: string[];
  availability: Availability[];
  commitment: CommitmentType[];
}
