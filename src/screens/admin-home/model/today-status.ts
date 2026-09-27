/**
 * 관리자 홈 첫 자리의 오늘 현황이다
 * (`docs/2-design/system/screens/admin-home.md`의 「오늘 현황」).
 *
 * **근무가 없는 날은 자리가 통째로 없다.** 띠가 0으로 서는 것이 아니라 볼 것이 없다.
 *
 * **확정 전에는 값이 `–`다.** 배정이 아직 안 굳어 분모가 없다.
 *
 * **지각을 따로 안 가른다.** 이 줄이 답하는 것은 「다 왔나」 하나고, 누가 늦었는지는 날
 * 상세의 명단이 말한다.
 *
 * 「오늘」을 KST로 옮기는 손도 여기 산다 — 관리자 홈은 근무표 슬라이스 밖이라 그쪽의 같은
 * 손을 못 부른다(슬라이스끼리는 서로를 못 부른다).
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const KST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 그 순간이 KST로 며칠인지다 — `"2026-10-08"`. */
export function kstDateOf(instant: string): string {
  return KST_DATE.format(new Date(instant));
}

export function kstToday(): string {
  return KST_DATE.format(new Date());
}

export type TodayStatus =
  | { kind: "none" }
  | { kind: "unconfirmed" }
  | {
      kind: "value";
      assignedCount: number;
      checkedInCount: number;
      notCheckedInCount: number;
      bandRatio: number;
    };

export type TodayStatusInput = {
  isConfirmed: boolean;
  assignedCount: number;
  checkedInCount: number;
};

export function todayStatus({
  isConfirmed,
  assignedCount,
  checkedInCount,
}: TodayStatusInput): TodayStatus {
  if (assignedCount === 0) {
    return { kind: "none" };
  }

  if (!isConfirmed) {
    return { kind: "unconfirmed" };
  }

  return {
    kind: "value",
    assignedCount,
    checkedInCount,
    notCheckedInCount: assignedCount - checkedInCount,
    bandRatio: checkedInCount / assignedCount,
  };
}

export type TodayBandShare = {
  key: string;
  label: string;
  value: number;
};

/**
 * 오늘 현황 띠의 몫들이다. 안 찍은 몫이 `bg.neutral-weak`라
 * (`docs/2-design/system/screens/admin-home.md`의 「관리자 홈 색」) 비율 띠의 넷째 자리에
 * 서야 하고 — 그 자리가 「아무것도 안 일어난 몫」이다 — 사이의 둘은 0으로 비운다. 0인 몫은
 * 띠에서도 범례에서도 빠진다.
 */
export function todayBandShares(
  checkedInCount: number,
  notCheckedInCount: number,
): TodayBandShare[] {
  return [
    { key: "checked-in", label: "출근", value: checkedInCount },
    { key: "unused-sky", label: "", value: 0 },
    { key: "unused-mint", label: "", value: 0 },
    { key: "not-checked-in", label: "안 찍음", value: notCheckedInCount },
  ];
}

/** 날짜를 요일까지 읽는다 — 「10월 8일(목)」. */
export function spellDate(workDate: string): string {
  const [, month, day] = workDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(`${workDate}T00:00:00Z`).getUTCDay()];

  return `${month}월 ${day}일(${weekday})`;
}
