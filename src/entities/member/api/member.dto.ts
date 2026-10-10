export type QualificationRow = {
  profile_id: string | null;
  position: string | null;
};

export type FilledQualificationRow = {
  profile_id: string;
  position: string;
};

export type MemberSummaryRow = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
};

export type MemberContactRow = {
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};

export type MemberRow = MemberSummaryRow & {
  role: string;
  left_at: string | null;
  erased_at: string | null;
  profile_private: MemberContactRow | null;
};

export type ActiveMemberRow = MemberRow & {
  notifications_enabled: boolean;
};

export type PushReachableRow = {
  profile_id: string;
  has_device: boolean;
};
