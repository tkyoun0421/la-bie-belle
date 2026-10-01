/**
 * 근무 취소 줄이 목록과 상세 시트와 확인 Dialog에서 입는 문안이다. 정본은
 * `docs/2-design/system/screens/approvals.md`의 「목록 문안」과 「상세 시트 문안」 표다.
 *
 * **달력 날짜와 타임스탬프를 갈라 읽는다.** `work_date`는 시각 없는 KST 달력 날짜라 UTC
 * 자정으로 읽어야 기기 시간대가 어디든 같은 요일이 나오고, 보낸 시각은 실제 타임스탬프라
 * `Asia/Seoul`로 옮겨야 달력 날짜와 시각이 맞는다.
 *
 * 같은 계산이 `schedule-admin` 슬라이스에도 있다. 슬라이스끼리 서로를 못 불러(lint 규칙 3)
 * 이 슬라이스가 제 것을 다시 짠다 — 합칠 자리는 `src/shared/lib/`다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const KST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const KST_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

export type CancelApprovalInput = {
  displayName: string;
  workDate: string;
  position: string;
  startsAt: string;
  endsAt: string;
  sentAt: string;
  reason: string;
};

export type CancelApprovalDetail = {
  title: string;
  subtitle: string;
  sentAtLine: string;
  reason: string;
};

/** `"10월 12일"` — 목록 줄과 확인 Dialog는 요일을 안 붙인다. */
function bareDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);

  return `${month}월 ${day}일`;
}

/** `"10월 12일(월)"` — 상세 시트 제목은 요일까지 말한다. */
function spelledDate(workDate: string): string {
  const weekday = WEEKDAYS[new Date(`${workDate}T00:00:00Z`).getUTCDay()];

  return `${bareDate(workDate)}(${weekday})`;
}

/** 목록 줄 제목 — 「이준호 · 10월 12일 메인」. */
export function cancelApprovalRowTitle(row: {
  displayName: string;
  workDate: string;
  position: string;
}): string {
  return `${row.displayName} · ${bareDate(row.workDate)} ${row.position}`;
}

/**
 * 근무 취소 확인 Dialog의 본문이다 — 승인이 무엇을 일으키는지를 그 자리에서 말한다.
 * 되돌릴 기록이 안 남는 판정이라 누르기 전에 한 번 더 읽는다.
 */
export function cancelApprovalConfirmBody(row: {
  displayName: string;
  workDate: string;
  position: string;
}): string {
  return `${bareDate(row.workDate)} ${row.position} 자리가 비고 ${row.displayName}님에게 알림이 가요`;
}

export function cancelApprovalDetail(
  input: CancelApprovalInput,
): CancelApprovalDetail {
  const sent = new Date(input.sentAt);

  return {
    title: `${input.displayName} · ${spelledDate(input.workDate)} ${input.position}`,
    subtitle: `${input.startsAt.slice(0, 5)}–${input.endsAt.slice(0, 5)}`,
    sentAtLine: `${bareDate(KST_DATE.format(sent))} ${KST_TIME.format(sent)}에 보냈어요`,
    reason: input.reason,
  };
}
