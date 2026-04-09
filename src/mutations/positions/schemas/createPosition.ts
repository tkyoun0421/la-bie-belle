import { z } from "zod";
import { positionAllowedGenderSchema } from "#/entities/positions/models/schemas/position";

export const createPositionInputSchema = z
  .object({
    allowedGender: positionAllowedGenderSchema,
    defaultRequiredCount: z
      .number()
      .int()
      .min(1, "기본 필수 인원은 1명 이상이어야 합니다."),
    name: z.string().trim().min(1, "포지션 이름을 입력해 주세요."),
  })
  .transform((value) => ({
    allowedGender: value.allowedGender,
    defaultRequiredCount: value.defaultRequiredCount,
    name: value.name.trim(),
  }));

export type CreatePositionInput = z.input<typeof createPositionInputSchema>;
export type CreatePositionValues = z.output<typeof createPositionInputSchema>;

export function parseCreatePositionInput(
  input: CreatePositionInput
): CreatePositionValues {
  return createPositionInputSchema.parse(input);
}
