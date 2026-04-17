import { z } from "zod";

export const assignmentKindSchema = z.enum(["regular", "training"]);

export const assignmentStatusSchema = z.enum([
  "assigned",
  "confirmed",
  "cancel_requested",
  "cancelled",
  "checked_in",
]);

export const assignmentSchema = z.object({
  assignedAt: z.string().datetime({ offset: true }),
  assignmentKind: assignmentKindSchema,
  eventId: z.string().uuid(),
  id: z.string().uuid(),
  positionId: z.string().uuid(),
  positionName: z.string().trim().min(1),
  status: assignmentStatusSchema,
  userId: z.string().uuid(),
  userName: z.string().trim().min(1),
});

export type AssignmentKind = z.infer<typeof assignmentKindSchema>;
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
