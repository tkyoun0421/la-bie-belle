/**
 * 요청 질의가 돌려주는 생 꼴이다. 자리와 날과 보낸 사람이 임베딩으로 딸려 와 중첩이
 * 깊고, 열 이름이 전부 DB 그대로다.
 */

export type SlotRequestCandidate = {
  profile_id: string;
  status: string;
  expires_at: string;
};

export type SlotRequest = {
  id: string;
  slot_id: string | null;
  closed_at: string | null;
  expires_at: string;
  request_candidates: SlotRequestCandidate[];
  slots: {
    id: string;
    positions: string[];
    days: { work_date: string; starts_at: string; ends_at: string };
  };
};

export type PendingApproval = {
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
