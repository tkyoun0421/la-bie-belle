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
 * 「오늘」을 KST로 옮기는 손은 `@/shared/lib/kstDate`가 소유한다 — 슬라이스 넷에 같은 손이
 * 각자 서 있던 것을 거기로 모았고, 이 슬라이스가 부르는 이름은 그대로 두고 이어 낸다.
 */

export { kstDateOf, kstToday, spellDate } from "@/shared/lib/kstDate";

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
