import { z } from "zod";

export const applyReplacementInputSchema = z.object({
  requestId: z.string().uuid(),
});

export type ApplyReplacementInput = z.infer<typeof applyReplacementInputSchema>;
