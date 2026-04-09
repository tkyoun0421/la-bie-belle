import { z } from "zod";

const deletePositionInputSchema = z.object({
  id: z.string().uuid("삭제할 포지션을 찾지 못했습니다."),
});

export type DeletePositionInput = z.input<typeof deletePositionInputSchema>;
export type DeletePositionValues = z.output<typeof deletePositionInputSchema>;

export function parseDeletePositionInput(
  input: DeletePositionInput
): DeletePositionValues {
  return deletePositionInputSchema.parse(input);
}
