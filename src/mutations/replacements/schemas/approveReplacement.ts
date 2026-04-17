import { z } from "zod";

export const approveReplacementInputSchema = z.object({
  replacementRequestId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type ApproveReplacementInput = z.infer<typeof approveReplacementInputSchema>;
