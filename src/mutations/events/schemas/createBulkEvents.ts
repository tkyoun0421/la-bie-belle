import { z } from "zod";
import { eventDateValueSchema } from "#/entities/events/models/schemas/event";

export const createBulkEventsInputSchema = z
  .object({
    eventDates: z.array(eventDateValueSchema).min(1, "최소 한 개 이상의 날짜를 선택해 주세요."),
    templateId: z.string().uuid("행사 템플릿을 다시 선택해 주세요."),
    title: z.string().trim().min(1, "행사명을 입력해 주세요."),
  })
  .transform((value) => ({
    ...value,
    title: value.title.trim(),
  }));

export type CreateBulkEventsInput = z.input<typeof createBulkEventsInputSchema>;
export type CreateBulkEventsValues = z.output<typeof createBulkEventsInputSchema>;

export function parseCreateBulkEventsInput(
  input: CreateBulkEventsInput
): CreateBulkEventsValues {
  return createBulkEventsInputSchema.parse(input);
}
