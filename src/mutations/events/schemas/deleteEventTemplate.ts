import { z } from "zod";

const deleteEventTemplateInputSchema = z.object({
  id: z.string().uuid("삭제할 템플릿을 찾지 못했습니다."),
});

export type DeleteEventTemplateInput = z.input<
  typeof deleteEventTemplateInputSchema
>;
export type DeleteEventTemplateValues = z.output<
  typeof deleteEventTemplateInputSchema
>;

export function parseDeleteEventTemplateInput(
  input: DeleteEventTemplateInput
): DeleteEventTemplateValues {
  return deleteEventTemplateInputSchema.parse(input);
}
