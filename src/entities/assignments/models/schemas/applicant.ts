import { z } from "zod";

export const applicantSchema = z.object({
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().trim().min(1),
  userEmail: z.string().email(),
  appliedAt: z.string().datetime({ offset: true }),
});

export type Applicant = z.infer<typeof applicantSchema>;
