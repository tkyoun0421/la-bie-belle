/**
 * 사람 목록과 자격이 통신에서 오는 꼴이다. 모양을 정하는 것은 `profiles`와 `profile_private`
 * 표와 `qualifications` 뷰라 열 이름이 DB 그대로 선다.
 *
 * 목록 꼴 셋이 포개지는 것은 화면마다 싣는 열이 달라서다 — 가입 대기·차단은 줄에 연락처를
 * 안 세우고, 퇴사 구획은 알림 갈래를 안 쓴다
 * (`docs/2-design/modules/account/screens/members.md`).
 */

/** 뷰가 좁혀 낸 뒤의 꼴이다 — 뷰라서 nullable로 생성되는 열 둘을 읽는 손이 메워 낸다. */
export type Qualification = {
  profile_id: string;
  position: string;
};

/** 목록 넷이 공통으로 싣는 열이다 — 누가 어느 목록인지를 가르는 시각 넷과 이름. */
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

/** 재직자 줄에만 붙는 알림 갈래 둘이다 — 받겠다는 의사와 기기가 닿는지. */
export type ActiveMemberRow = MemberRow & {
  notifications_enabled: boolean;
  has_device: boolean;
};
