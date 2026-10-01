import type { ReachState } from "@/features/notification/model/reachState";

/**
 * 갈래를 받아 그 자리의 문장을 고른다. 판정은 [`reach-state`](reachState.ts) 하나가 내고
 * 여기는 고르기만 한다 — 판정을 자리마다 만들면 같은 사람이 화면마다 다른 갈래로 읽힌다.
 *
 * **가르는 자리와 합치는 자리가 다르다.** 직원 목록과 사람 시트는 스스로 끈 사람과 기기가
 * 안 연결된 사람을 갈라 적는다 — 관리자가 할 말이 다르다
 * (`docs/2-design/modules/account/screens/members.md`의 「목록 문안」·「사람 시트 문안」).
 * 확정 뒤 배정을 바꾸는 확인 자리는 한 줄로 합쳐 말하는데 그 문장은 여기 없다 —
 * [`force-change-copy`](../../../screens/scheduleAdmin/model/forceChangeCopy.ts)가
 * 제 표 안에서 들고 「두 사람」으로 묶는 경우까지 맡는다. 그 자리는 갈래가 아니라 「닿나」
 * 하나만 받으면 되고, 받는 불린은 이 파일과 같은 판정에서 나온다.
 *
 * **퇴사한 사람에게는 아무것도 안 선다.** 보낼 알림이 없어 갈래가 붙어도 관리자가 할 일이
 * 없고, 1년이 지나 비워진 사람은 계정이 지워져 갈래 자체가 안 나온다.
 *
 * 닿는 사람에게 따로 한 마디를 안 붙이는 것은 그것이 기본이라서다 — 전원에게 붙는 표시는
 * 아무것도 안 가른다.
 */

const UNREACHABLE: ReadonlySet<ReachState> = new Set<ReachState>([
  "off",
  "no-device",
]);

const LIST_SUFFIX: Partial<Record<ReachState, string>> = {
  off: "· 알림 꺼둠",
  "no-device": "· 기기 안 연결",
};

const SHEET_LINE: Partial<Record<ReachState, string>> = {
  off: "알림을 꺼두었어요",
  "no-device": "기기에서 알림을 꺼서 안 가요",
};

function shows(reach: ReachState, active: boolean): boolean {
  return active && UNREACHABLE.has(reach);
}

/** 목록 줄의 연락처 뒤에 붙는 한 마디다. */
export function getMemberListSuffix(
  reach: ReachState,
  active: boolean,
): string | null {
  return shows(reach, active) ? (LIST_SUFFIX[reach] ?? null) : null;
}

/** 사람 시트의 알림 줄이다. */
export function getMemberSheetLine(
  reach: ReachState,
  active: boolean,
): string | null {
  return shows(reach, active) ? (SHEET_LINE[reach] ?? null) : null;
}
