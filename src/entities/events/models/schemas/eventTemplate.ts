import { z } from "zod";

const timeValueSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "시간은 HH:mm 형식이어야 합니다.");

export const eventTemplateSlotSchema = z.object({
  positionId: z.string().uuid(),
  positionName: z.string().trim().min(1),
  requiredCount: z.number().int().min(1),
  trainingCount: z.number().int().min(0),
});

export const eventTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  timeLabel: z.string().min(1),
  firstServiceAt: timeValueSchema,
  lastServiceEndAt: timeValueSchema,
  createdAt: z.string().datetime({ offset: true }),
  slotDefaults: z.array(eventTemplateSlotSchema).min(1),
});

export const eventTemplatesResponseSchema = z.object({
  templates: z.array(eventTemplateSchema),
});

export type EventTemplate = z.infer<typeof eventTemplateSchema>;
export type EventTemplateSlot = z.infer<typeof eventTemplateSlotSchema>;
