import { z } from "zod";
import { timeValueSchema } from "#/entities/events/models/schemas/eventTemplate";

export const eventStatusSchema = z.enum([
  "draft",
  "recruiting",
  "staffed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const eventDateValueSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다.");

export const eventPositionSlotSchema = z.object({
  positionId: z.string().uuid(),
  positionName: z.string().trim().min(1),
  requiredCount: z.number().int().min(1),
  trainingCount: z.number().int().min(0),
});

export const eventDetailSchema = z.object({
  createdAt: z.string().datetime({ offset: true }),
  eventDate: eventDateValueSchema,
  firstServiceAt: timeValueSchema,
  id: z.string().uuid(),
  lastServiceEndAt: timeValueSchema,
  positionSlots: z.array(eventPositionSlotSchema),
  status: eventStatusSchema,
  templateId: z.string().uuid().nullable(),
  timeLabel: z.string().trim().min(1),
  title: z.string().trim().min(1),
});

export type EventStatus = z.infer<typeof eventStatusSchema>;
export type EventPositionSlot = z.infer<typeof eventPositionSlotSchema>;
export type EventDetail = z.infer<typeof eventDetailSchema>;
