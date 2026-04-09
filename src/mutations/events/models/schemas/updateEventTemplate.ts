import { z } from "zod";
import {
  parseCreateEventTemplateInput,
  type CreateEventTemplateInput,
  type CreateEventTemplateValues,
} from "#/mutations/events/models/schemas/createEventTemplate";

const updateEventTemplateIdSchema = z.object({
  id: z.string().uuid("수정할 템플릿을 찾지 못했습니다."),
});

export type UpdateEventTemplateInput = {
  id: string;
} & CreateEventTemplateInput;

export type UpdateEventTemplateValues = {
  id: string;
} & CreateEventTemplateValues;

export function parseUpdateEventTemplateInput(
  input: UpdateEventTemplateInput
): UpdateEventTemplateValues {
  const { id, ...rest } = input;
  const parsedId = updateEventTemplateIdSchema.parse({ id });
  const parsedRest = parseCreateEventTemplateInput(rest);

  return {
    id: parsedId.id,
    ...parsedRest,
  };
}
