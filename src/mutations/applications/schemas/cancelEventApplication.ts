import { z } from "zod";

export const cancelEventApplicationInputSchema = z.object({
  eventId: z.string().uuid("행사를 다시 선택해 주세요."),
});

export type CancelEventApplicationInput = z.input<
  typeof cancelEventApplicationInputSchema
>;
export type CancelEventApplicationValues = z.output<
  typeof cancelEventApplicationInputSchema
>;

export function parseCancelEventApplicationInput(
  input: CancelEventApplicationInput
): CancelEventApplicationValues {
  return cancelEventApplicationInputSchema.parse(input);
}
