export type SlotRequestCandidateRow = {
  profile_id: string;
  status: string;
  expires_at: string;
};

export type SlotRequestRow = {
  id: string;
  slot_id: string | null;
  closed_at: string | null;
  expires_at: string;
  request_candidates: SlotRequestCandidateRow[];
  slots: {
    id: string;
    positions: string[];
    days: { work_date: string; starts_at: string; ends_at: string };
  };
};

export type PendingApprovalRow = {
  id: string;
  assignment_id: string;
  reason: string;
  created_at: string;
  assignments: {
    day_id: string;
    position: string;
    days: { work_date: string; starts_at: string; ends_at: string };
  };
  profiles: { display_name: string | null; photo_url: string | null };
};
