import { z } from "zod";
import { eventDateValueSchema } from "#/entities/events/models/schemas/event";

export const createEventInputSchema = z
  .object({
    eventDate: eventDateValueSchema,
    templateId: z.string().uuid("행사 템플릿을 다시 선택해 주세요."),
    title: z.string().trim().min(1, "행사명을 입력해 주세요."),
  })
  .transform((value) => ({
    ...value,
    title: value.title.trim(),
  }));

export type CreateEventInput = z.input<typeof createEventInputSchema>;
export type CreateEventValues = z.output<typeof createEventInputSchema>;

export function parseCreateEventInput(
  input: CreateEventInput
): CreateEventValues {
  return createEventInputSchema.parse(input);
}
