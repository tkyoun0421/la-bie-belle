export type Qualification = {
  profileId: string;
  position: string;
};

export type MemberSummary = {
  id: string;
  displayName: string | null;
  photoUrl: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  blockedAt: string | null;
};

export type Member = MemberSummary & {
  role: string;
  leftAt: string | null;
  erasedAt: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
};

export type ActiveMember = Member & {
  notificationsEnabled: boolean;
  hasDevice: boolean;
};
