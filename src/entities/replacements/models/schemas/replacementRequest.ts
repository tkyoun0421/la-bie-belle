import { z } from "zod";

export const replacementRequestStatusSchema = z.enum([
  "open",
  "pending_manager_approval",
  "approved",
  "closed",
]);

export const replacementRequestSchema = z.object({
  id: z.string().uuid(),
  cancelledAssignmentId: z.string().uuid(),
  positionId: z.string().uuid(),
  status: replacementRequestStatusSchema,
  approvedAssignmentId: z.string().uuid().nullable(),
  closedAt: z.string().datetime({ offset: true }).nullable(),
  closedBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type ReplacementRequestStatus = z.infer<typeof replacementRequestStatusSchema>;
export type ReplacementRequest = z.infer<typeof replacementRequestSchema>;

export const replacementListItemSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  eventTitle: z.string().trim().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeLabel: z.string().trim().min(1),
  positionId: z.string().uuid(),
  positionName: z.string().trim().min(1),
  status: replacementRequestStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export type ReplacementListItem = z.infer<typeof replacementListItemSchema>;
