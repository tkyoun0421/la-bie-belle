export type MyProfileRow = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  role: string;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
  left_at: string | null;
  notifications_enabled: boolean;
};

export type ProfilePrivateRow = {
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};
