import { z } from "zod";

import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export const REJECT_REASON_MAX_LENGTH = 200;

const REJECT_REASON_MAX_LENGTH_MESSAGE = `사유는 ${REJECT_REASON_MAX_LENGTH}자 이내로 입력해 주세요`;

export const RejectReasonSchema = z
  .string()
  .trim()
  .max(REJECT_REASON_MAX_LENGTH, REJECT_REASON_MAX_LENGTH_MESSAGE);

const ALREADY_PROCESSED_PG_CODE = "22023";
const FORBIDDEN_PG_CODE = "42501";

export function mapApprovalRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === ALREADY_PROCESSED_PG_CODE) {
    return ERROR_CODE.IDENTITY_ALREADY_PROCESSED;
  }
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.COMMON_FORBIDDEN;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
