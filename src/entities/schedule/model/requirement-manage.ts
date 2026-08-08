import { z } from "zod";

import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export const CopyRequirementsInputSchema = z.object({ scheduleId: z.string().uuid() });
export type CopyRequirementsInput = z.infer<typeof CopyRequirementsInputSchema>;

export const SetRequirementInputSchema = z.object({
  scheduleId: z.string().uuid(),
  positionId: z.string().uuid(),
  requiredCount: z.number().int().min(0),
});
export type SetRequirementInput = z.infer<typeof SetRequirementInputSchema>;

export const RemoveRequirementInputSchema = z.object({
  scheduleId: z.string().uuid(),
  positionId: z.string().uuid(),
});
export type RemoveRequirementInput = z.infer<typeof RemoveRequirementInputSchema>;

const FORBIDDEN_PG_CODE = "42501";
const STATUS_CONFLICT_PG_CODE = "LB020";
const VALIDATION_PG_CODE = "22023";

export function mapRequirementRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === STATUS_CONFLICT_PG_CODE) {
    return ERROR_CODE.SCHEDULING_STATUS_CONFLICT;
  }
  if (pgCode === VALIDATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
