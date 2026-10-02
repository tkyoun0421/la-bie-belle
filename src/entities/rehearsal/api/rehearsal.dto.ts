/**
 * 리허설 한 행이 통신에서 오는 꼴이다. 열 이름이 표 그대로고, 읽는 손 둘(`getMyRehearsals`·
 * `getAllRehearsals`)의 `returns<>`가 이 꼴을 건다.
 *
 * **갈래를 적는 열이 없어 행이 스스로 말한다** — `count`가 차 있으면 건수 갈래, 시각 둘이 차
 * 있으면 시각 갈래다. 셋이 다 널인 행은 표의 check가 막는다.
 */

export type Rehearsal = {
  id: string;
  profile_id: string;
  work_date: string;
  starts_at: string | null;
  ends_at: string | null;
  count: number | null;
};

/**
 * 관리자가 보는 전원 리허설이다. **이름을 임베딩한다** — 날 시트가 줄마다 이름을 앞에 붙여
 * (`docs/2-design/modules/schedule/screens/rehearsal.md`의 「문안」) 줄마다 프로필을 다시
 * 읽지 않는다. 조인이라 중첩 꼴이 그대로 온다.
 */
export type RehearsalWithName = Rehearsal & {
  profiles: { display_name: string | null } | null;
};
