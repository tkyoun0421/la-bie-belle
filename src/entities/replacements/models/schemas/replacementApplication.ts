import { z } from "zod";

export const replacementApplicationSchema = z.object({
  id: z.string().uuid(),
  replacementRequestId: z.string().uuid(),
  userId: z.string().uuid(),
  appliedAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type ReplacementApplication = z.infer<typeof replacementApplicationSchema>;
