/**
 * 하루치 금액이다. **540분까지 1배, 넘는 몫이 1.5배**다
 * (`docs/2-design/modules/payroll/README.md`의 PAY-005·PAY-028) — 기준을 배정·조정·리허설을
 * 합친 총 분 하나로 본다.
 *
 * **`kind`를 여기서 낸다.** 「연장」 배지가 붙는 날을 화면이 다시 판정하면 같은 규칙이 두 벌
 * 서고 어긋날 때 어느 쪽이 정본인지가 사라진다.
 *
 * 0분은 결근이다 — 조정 음수로 지워진 날도, 관리자가 아직 안 누른 날도 같은 값으로 내려온다.
 *
 * 분모 120은 「분을 시간으로(60) × 1.5배를 정수로(2)」다. 시급이 60으로 안 나눠떨어져도
 * 반올림을 한 번만 하려고 마지막에 한 번 나눈다.
 */

export type DayKind = "normal" | "overtime" | "absent";

export type DayAmount = {
  minutes: number;
  amount: number;
  kind: DayKind;
};

/** 1배로 세는 몫의 상한이다. 넘는 몫이 연장이고, 화면이 그 초과분을 줄에 적는다. */
export const REGULAR_MINUTES = 540;

const SCALE = 120;

const REGULAR_WEIGHT = 2;

const OVERTIME_WEIGHT = 3;

export function dayAmount({
  minutes,
  wage,
}: {
  minutes: number;
  wage: number;
}): DayAmount {
  if (minutes <= 0) {
    return { minutes, amount: 0, kind: "absent" };
  }

  const regular = Math.min(minutes, REGULAR_MINUTES);
  const overtime = minutes - regular;
  const weighted = regular * REGULAR_WEIGHT + overtime * OVERTIME_WEIGHT;

  return {
    minutes,
    amount: Math.round((wage * weighted) / SCALE),
    kind: overtime > 0 ? "overtime" : "normal",
  };
}
