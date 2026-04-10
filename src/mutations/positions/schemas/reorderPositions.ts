import { z } from "zod";

export const reorderPositionsInputSchema = z.object({
  positionIds: z
    .array(z.string().uuid())
    .min(1, "순서를 변경할 포지션이 없습니다.")
    .refine(
      (positionIds) => new Set(positionIds).size === positionIds.length,
      "중복된 포지션이 포함되어 있습니다."
    ),
});

export type ReorderPositionsInput = z.input<typeof reorderPositionsInputSchema>;
export type ReorderPositionsValues = z.output<typeof reorderPositionsInputSchema>;

export function parseReorderPositionsInput(
  input: ReorderPositionsInput
): ReorderPositionsValues {
  return reorderPositionsInputSchema.parse(input);
}
