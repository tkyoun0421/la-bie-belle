import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";

export function canAddOn(
  kind: RehearsalKind,
  rows: readonly { id: string }[],
): boolean {
  return kind === "time" || rows.length === 0;
}
