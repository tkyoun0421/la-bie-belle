export type Excuse = {
  id: string;
  dayId: string;
  profileId: string;
  body: string;
  submittedAt: string;
  decidedAt: string | null;
  decision: string | null;
  decisionReason: string | null;
};
