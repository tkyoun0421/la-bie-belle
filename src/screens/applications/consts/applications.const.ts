/**
 * 근무 신청 모아보기가 쓰는 정해진 값과 문안이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 신청 모아보기 짜임」과
 * 그 문안 표다.
 */

/**
 * 모아보기의 탭 둘이다.
 *
 * **탭이 질의를 안 움직인다.** 둘이 같은 한 질의를 두 방향으로 접을 뿐이라 탭을 오가도
 * 서버에 다시 안 묻는다 — 탭이 읽을 것을 가르는 통계와 갈리는 자리다.
 */
export const APPLICATIONS_TABS = ["date", "person"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "date", label: "날짜순" },
  { value: "person", label: "사람순" },
];

export const APPLICATIONS_COPY = {
  changeDeadline: "마감일 바꾸기",
  empty: "아직 들어온 신청이 없어요",
} as const;
