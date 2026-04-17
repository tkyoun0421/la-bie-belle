import { z } from "zod";

export const cancelAssignmentInputSchema = z.object({
  assignmentId: z.string().uuid(),
  positionId: z.string().uuid(),
});

export type CancelAssignmentInput = z.infer<typeof cancelAssignmentInputSchema>;
