import { kstDateOf } from "@/screens/scheduleAdmin/model/formatScheduleDate";

/**
 * 확정 버튼의 세 모습이다 — 잠김·열림·끝남
 * (`docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「세 모습」).
 *
 * **경계는 날짜가 바뀌는 자정이다.** 마감 당일까지는 잠김이고 다음 날 KST 0시부터 열린다
 * (SCH-008). 화면을 열어둔 채 자정을 넘기면 그 자리에서는 안 풀리고 다음 진입에서 풀린다 —
 * 타이머를 두지 않는 대신 `now`를 다시 받는다.
 *
 * **확정이 마감을 이긴다.** `confirmed_at`이 있으면 마감도 오늘도 안 본다. 확정된 달은
 * 마감이 지나 있고, 확정됐다는 것이 더 많은 것을 말한다.
 */

export type ConfirmAffordance = "locked" | "open" | "ended";

export type ConfirmAffordanceInput = {
  applicationDeadline: string | null;
  confirmedAt: string | null;
  now: string;
};

export function confirmAffordance({
  applicationDeadline,
  confirmedAt,
  now,
}: ConfirmAffordanceInput): ConfirmAffordance {
  if (confirmedAt !== null) {
    return "ended";
  }

  if (applicationDeadline === null) {
    return "locked";
  }

  return kstDateOf(now) > applicationDeadline ? "open" : "locked";
}

/** 잠김의 보조 문구다 — 되는 날을 말한다. */
export function confirmUnlockLine(applicationDeadline: string): string {
  const unlocksAt = new Date(`${applicationDeadline}T00:00:00Z`);

  unlocksAt.setUTCDate(unlocksAt.getUTCDate() + 1);

  return `${unlocksAt.getUTCMonth() + 1}월 ${unlocksAt.getUTCDate()}일부터 확정할 수 있어요`;
}
