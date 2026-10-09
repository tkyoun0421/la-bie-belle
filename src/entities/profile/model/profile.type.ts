export type Profile = {
  id: string;
  displayName: string | null;
  photoUrl: string | null;
  role: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  blockedAt: string | null;
  leftAt: string | null;
  notificationsEnabled: boolean;
};

export type ProfilePrivate = {
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
};

export type MyProfile = Profile & ProfilePrivate;
