/**
 * 날 상세가 「확정 시점에 있던 날」인지 「확정 뒤 새로 연 날」인지를 가른다. 확정이 묶는 것은
 * 그때 있던 날들이라(`docs/2-design/modules/schedule/README.md`의 SCH-018) 새로 연 날은
 * 확정 전과 똑같이 자물쇠·끌기·자리 추가가 선다.
 *
 * **경계는 엄격 부등호다.** 같은 시각이면 확정 시점에 있던 날이다 — 시각 비교라 같은 초에
 * 걸리면 판정이 흔들릴 수 있어 한쪽으로 못 박았다.
 */

export type DayConfirmGate =
  "before_confirm" | "confirmed_original" | "confirmed_reopened";

export type DayConfirmGateInput = {
  openedAt: string;
  confirmedAt: string | null;
};

export function dayConfirmGate(input: DayConfirmGateInput): DayConfirmGate {
  if (input.confirmedAt === null) {
    return "before_confirm";
  }

  return input.openedAt > input.confirmedAt
    ? "confirmed_reopened"
    : "confirmed_original";
}

/** 잠금 아이콘을 회색으로 남기지 않고 지우는 자리다 — 눌리지 않는 것을 남기면 묻게 한다. */
export function allowsStructureChange(gate: DayConfirmGate): boolean {
  return gate !== "confirmed_original";
}
