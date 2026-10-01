/**
 * 관리자 홈의 「승인할 일」 줄 글자다. 정본은
 * `docs/2-design/system/screens/adminHome.md`의 「관리자 홈 문안」이다.
 *
 * **세는 것은 사람이 아니라 건이다.** 한 사람이 요청 둘을 낼 수 있고 관리자가 처리하는
 * 단위도 건이다 — 가입 대기가 「2명」인 것은 그쪽이 사람을 받는 자리이기 때문이다.
 *
 * **0건이어도 줄이 선다.** 눌러 보고 비었다는 것을 확인하는 것이, 안 눌리는 줄을 보고 왜 안
 * 눌리나 하는 것보다 낫다.
 *
 * 지금 세는 것은 근무 취소 대기뿐이다. 사유 건수는 `attendance-excuse`가 같은 훅에 더하면
 * 이 줄이 그대로 같이 센다.
 */

export function approvalsLine(pendingCount: number): string {
  return `승인할 일 · ${pendingCount}건`;
}
