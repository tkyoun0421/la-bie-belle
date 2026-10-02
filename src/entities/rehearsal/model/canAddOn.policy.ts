import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";

/**
 * 날 시트의 「리허설 넣기」가 서는지다. 건수 갈래인 날은 하루 한 줄로 묶여 있어
 * (`docs/2-design/modules/schedule/README.md`의 SCH-023) 줄이 이미 있으면 버튼이 사라지고,
 * 더 하려면 그 줄의 건수를 올린다. 시각 갈래는 구간만 안 겹치면 여러 줄이라 제한이 없다.
 *
 * 버튼을 남겨두고 누른 뒤에 막지 않는다 — 그러면 왜 막혔는지를 그때 설명해야 한다
 * (`docs/2-design/modules/schedule/screens/rehearsal.md`의 「날 시트 짜임」).
 */
export function canAddOn(
  kind: RehearsalKind,
  rows: readonly { id: string }[],
): boolean {
  return kind === "time" || rows.length === 0;
}
