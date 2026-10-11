import { countBy } from "@/shared/utils/collect";
import type { OpenSlot } from "@/entities/schedule/model/schedule.type";
import { formatScheduleDate } from "@/entities/schedule/utils/formatScheduleDate.utils";

const LISTED_LIMIT = 4;

export type OpenSlotItem = {
  workDate: string;
  position: string;
};

export type OpenSlotSummary = {
  totalCount: number;
  items: OpenSlotItem[];
  overflowCount: number;
};

export function countOpenSlotsByDate(
  rows: readonly OpenSlot[],
): Record<string, number> {
  return Object.fromEntries(countBy(rows, (row) => row.workDate));
}

export function summarizeOpenSlots(rows: readonly OpenSlot[]): OpenSlotSummary {
  const items = rows.slice(0, LISTED_LIMIT).map((row) => ({
    workDate: row.workDate,
    position: row.positions.join("·"),
  }));

  return {
    totalCount: rows.length,
    items,
    overflowCount: Math.max(0, rows.length - LISTED_LIMIT),
  };
}

export function openSlotLine({ workDate, position }: OpenSlotItem): string {
  return `${formatScheduleDate(workDate)} · ${position}`;
}
