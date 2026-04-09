import { z } from "zod";

export const positionAllowedGenderSchema = z.enum(["all", "female", "male"]);

export const positionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  allowedGender: positionAllowedGenderSchema,
});

export const positionsResponseSchema = z.object({
  positions: z.array(positionSchema),
});

export type Position = z.infer<typeof positionSchema>;
export type PositionAllowedGender = z.infer<typeof positionAllowedGenderSchema>;
