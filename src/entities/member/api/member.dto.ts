export type Qualification = {
  profile_id: string;
  position: string;
};

export type MemberProfileRow = {
  id: string;
  display_name: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
};

export type MemberListRow = MemberProfileRow & {
  photo_url: string | null;
};

export type MemberRow = MemberListRow & {
  role: string;
  left_at: string | null;
  erased_at: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};

export type ActiveMemberRow = MemberRow & {
  notifications_enabled: boolean;
  has_device: boolean;
};
