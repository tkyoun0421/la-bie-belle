export type RequestAnswer = "accept" | "decline";

export type CancelDecision = "approved" | "rejected";

export type SlotRequestCandidate = {
  profileId: string;
  status: string;
  expiresAt: string;
};

export type SlotRequest = {
  id: string;
  slotId: string | null;
  closedAt: string | null;
  expiresAt: string;
  candidates: SlotRequestCandidate[];
  positions: string[];
  workDate: string;
  startsAt: string;
  endsAt: string;
};

export type PendingApproval = {
  id: string;
  assignmentId: string;
  reason: string;
  createdAt: string;
  dayId: string;
  position: string;
  workDate: string;
  startsAt: string;
  endsAt: string;
  name: string | null;
  photoUrl: string | null;
};
