import { z } from "zod";

export const applicationStatusSchema = z.enum(["applied", "cancelled"]);

export const eventApplicationStatusRecordSchema = z.object({
  eventId: z.string().uuid(),
  status: applicationStatusSchema,
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type EventApplicationStatusRecord = z.infer<
  typeof eventApplicationStatusRecordSchema
>;
