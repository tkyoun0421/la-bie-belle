/**
 * 내 프로필이 통신에서 오는 꼴이다. 표가 둘로 갈려 있어 꼴도 둘이고
 * (`docs/2-design/modules/account/design.md`의 「개인정보는 표를 가른다」) 읽는 손도 둘이다.
 */

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

/** 「나」 화면이 보는 한 덩이다 — 표 둘의 행을 합친 꼴이라 열 이름도 DB 그대로다. */
export type MyProfile = MyProfileRow & ProfilePrivateRow;
