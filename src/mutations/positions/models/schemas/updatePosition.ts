import { z } from "zod";
import {
  parseCreatePositionInput,
  type CreatePositionInput,
  type CreatePositionValues,
} from "#/mutations/positions/models/schemas/createPosition";

const updatePositionIdSchema = z.object({
  id: z.string().uuid("수정할 포지션을 찾지 못했습니다."),
});

export type UpdatePositionInput = {
  id: string;
} & CreatePositionInput;

export type UpdatePositionValues = {
  id: string;
} & CreatePositionValues;

export function parseUpdatePositionInput(
  input: UpdatePositionInput
): UpdatePositionValues {
  const { id, ...rest } = input;
  const parsedId = updatePositionIdSchema.parse({ id });
  const parsedRest = parseCreatePositionInput(rest);

  return {
    id: parsedId.id,
    ...parsedRest,
  };
}
