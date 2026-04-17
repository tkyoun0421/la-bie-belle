import { z } from "zod";

export const createAssignmentInputSchema = z.object({
  eventId: z.string().uuid("행사를 다시 선택해 주세요."),
  positionId: z.string().uuid("포지션을 다시 선택해 주세요."),
  userId: z.string().uuid("배정할 멤버를 다시 선택해 주세요."),
  assignmentKind: z.enum(["regular", "training"]).optional(),
});

export type CreateAssignmentInput = z.input<typeof createAssignmentInputSchema>;
export type CreateAssignmentValues = z.output<typeof createAssignmentInputSchema>;

export function parseCreateAssignmentInput(
  input: CreateAssignmentInput
): CreateAssignmentValues {
  return createAssignmentInputSchema.parse(input);
}
