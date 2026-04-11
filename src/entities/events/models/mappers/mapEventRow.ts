import {
  eventDetailSchema,
  type EventDetail,
} from "#/entities/events/models/schemas/event";
import type { TableRow } from "#/shared/types/database";

export type EventSlotPositionRow =
  | Pick<TableRow<"positions">, "id" | "name" | "sort_order">
  | Pick<TableRow<"positions">, "id" | "name" | "sort_order">[]
  | null;

export type EventPositionSlotRow = Pick<
  TableRow<"event_position_slots">,
  "position_id" | "required_count" | "training_count"
> & {
  positions: EventSlotPositionRow;
};

export type EventDetailRow = Pick<
  TableRow<"events">,
  | "created_at"
  | "event_date"
  | "first_service_at"
  | "id"
  | "last_service_end_at"
  | "status"
  | "template_id"
  | "time_label"
  | "title"
> & {
  event_position_slots: EventPositionSlotRow[];
};

function resolvePosition(
  position: EventSlotPositionRow
): Pick<TableRow<"positions">, "id" | "name" | "sort_order"> | null {
  return Array.isArray(position) ? (position[0] ?? null) : position;
}

export function mapEventDetailRow(row: EventDetailRow): EventDetail {
  const sortedSlots = [...row.event_position_slots].sort((left, right) => {
    const leftPosition = resolvePosition(left.positions);
    const rightPosition = resolvePosition(right.positions);
    const sortOrderDifference =
      (leftPosition?.sort_order ?? Number.MAX_SAFE_INTEGER) -
      (rightPosition?.sort_order ?? Number.MAX_SAFE_INTEGER);

    if (sortOrderDifference !== 0) {
      return sortOrderDifference;
    }

    return (leftPosition?.name ?? "").localeCompare(rightPosition?.name ?? "");
  });

  return eventDetailSchema.parse({
    createdAt: row.created_at,
    eventDate: row.event_date,
    firstServiceAt: row.first_service_at.slice(0, 5),
    id: row.id,
    lastServiceEndAt: row.last_service_end_at.slice(0, 5),
    positionSlots: sortedSlots.map((slot) => {
      const position = resolvePosition(slot.positions);

      return {
        positionId: slot.position_id,
        positionName: position?.name ?? "알 수 없는 포지션",
        requiredCount: slot.required_count,
        trainingCount: slot.training_count,
      };
    }),
    status: row.status,
    templateId: row.template_id,
    timeLabel: row.time_label,
    title: row.title,
  });
}
