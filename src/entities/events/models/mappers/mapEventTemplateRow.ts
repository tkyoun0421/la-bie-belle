import {
  eventTemplateSchema,
  type EventTemplate,
} from "#/entities/events/models/schemas/eventTemplate";
import type { TableRow } from "#/shared/types/database";

export type EventTemplateSlotPositionRow =
  | Pick<TableRow<"positions">, "default_required_count" | "id" | "name">
  | Pick<TableRow<"positions">, "default_required_count" | "id" | "name">[]
  | null;

export type EventTemplateSlotRow = Pick<
  TableRow<"event_template_position_slots">,
  "position_id" | "required_count_override" | "training_count"
> & {
  positions: EventTemplateSlotPositionRow;
};

export type EventTemplateRow = Pick<
  TableRow<"event_templates">,
  | "created_at"
  | "first_service_at"
  | "id"
  | "is_primary"
  | "last_service_end_at"
  | "name"
  | "time_label"
> & {
  event_template_position_slots: EventTemplateSlotRow[];
};

export function mapEventTemplateRow(row: EventTemplateRow): EventTemplate {
  return eventTemplateSchema.parse({
    createdAt: row.created_at,
    firstServiceAt: row.first_service_at.slice(0, 5),
    id: row.id,
    isPrimary: row.is_primary,
    lastServiceEndAt: row.last_service_end_at.slice(0, 5),
    name: row.name,
    slotDefaults: row.event_template_position_slots.map((slot) => {
      const position = Array.isArray(slot.positions)
        ? (slot.positions[0] ?? null)
        : slot.positions;

      return {
        positionId: slot.position_id,
        positionName: position?.name ?? "알 수 없는 포지션",
        requiredCount:
          slot.required_count_override ?? position?.default_required_count ?? 1,
        trainingCount: slot.training_count,
      };
    }),
    timeLabel: row.time_label,
  });
}
