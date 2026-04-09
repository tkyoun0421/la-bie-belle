import {
  eventTemplateSchema,
  type EventTemplate,
} from "#/queries/events/models/schemas/eventTemplate";

export type EventTemplateSlotRow = {
  position_id: string;
  positions:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
  required_count: number;
  training_count: number;
};

export type EventTemplateRow = {
  created_at: string;
  event_template_position_slots: EventTemplateSlotRow[];
  first_service_at: string;
  id: string;
  last_service_end_at: string;
  name: string;
  time_label: string;
};

export function mapEventTemplateRow(row: EventTemplateRow): EventTemplate {
  return eventTemplateSchema.parse({
    id: row.id,
    name: row.name,
    timeLabel: row.time_label,
    firstServiceAt: row.first_service_at.slice(0, 5),
    lastServiceEndAt: row.last_service_end_at.slice(0, 5),
    createdAt: row.created_at,
    slotDefaults: row.event_template_position_slots.map((slot) => {
      const position = Array.isArray(slot.positions)
        ? (slot.positions[0] ?? null)
        : slot.positions;

      return {
        positionId: slot.position_id,
        positionName: position?.name ?? "알 수 없는 포지션",
        requiredCount: slot.required_count,
        trainingCount: slot.training_count,
      };
    }),
  });
}
