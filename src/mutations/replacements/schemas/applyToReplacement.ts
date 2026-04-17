import { z } from "zod";

export const applyToReplacementInputSchema = z.object({
  replacementRequestId: z.string().uuid(),
});

export type ApplyToReplacementInput = z.infer<typeof applyToReplacementInputSchema>;
