/**
 * 관리자 홈이 쓰는 업무 상수와 문안이다. 정본은
 * `docs/2-design/system/screens/adminHome.md`의 「빈 자리 카드」와 「관리자 홈 문안」이다.
 */

/**
 * 빈 자리 카드가 서는 남은 날이다 — 예식이 사흘 안인데 자리가 빈 날마다 한 장이다.
 *
 * **사흘인 것은 NTF-013과 같은 수다.** 푸시가 예식 3일 전 저녁 9시에 한 번 가고 카드는 그
 * 뒤로 채워질 때까지 화면에 남는다 — 푸시는 한 번이고 카드는 상태다. 그래서 두 자리가 같은
 * 수를 각자 들고, 재촉을 며칠 전부터 할지가 바뀌면 둘을 같이 고친다.
 */
export const WITHIN_DAYS = 3;

/**
 * 관리자 홈의 문안이다. 정본은 같은 문서의 「관리자 홈 문안」이다.
 *
 * **승인할 일 줄만 여기 없다.** 그 줄은 건수를 문장 안에 담아서
 * [`approvalsLine`](../utils/approvalsLine.utils.ts)이 글월째 만든다.
 */
export const ADMIN_HOME_COPY = {
  appBarTitle: "관리자",
  allCheckedIn: "전원 출근했어요",
  scheduleTile: "근무표 관리",
  defaultsRow: "근무 시간 기본값",
  pendingRow: "가입 대기",
  membersRow: "직원",
  wagesRow: "시급",
  qrRow: "QR",
  statsRow: "통계",
  peopleSuffix: "명",
  assignedSuffix: "명",
} as const;
