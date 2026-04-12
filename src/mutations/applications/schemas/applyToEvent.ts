import { z } from "zod";

export const applyToEventInputSchema = z.object({
  eventId: z.string().uuid("행사를 다시 선택해 주세요."),
});

export type ApplyToEventInput = z.input<typeof applyToEventInputSchema>;
export type ApplyToEventValues = z.output<typeof applyToEventInputSchema>;

export function parseApplyToEventInput(
  input: ApplyToEventInput
): ApplyToEventValues {
  return applyToEventInputSchema.parse(input);
}
