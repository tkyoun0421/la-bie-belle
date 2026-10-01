/**
 * 근무 신청 질의가 돌려주는 생 꼴이다. 열 이름이 DB 그대로고 신청자 이름이 임베딩으로
 * 딸려 온다.
 */

export type AvailabilityRow = {
  profile_id: string;
  work_date: string;
  profiles: { display_name: string | null } | null;
};
