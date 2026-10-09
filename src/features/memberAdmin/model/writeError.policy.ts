import { errorCodeOf } from "@/shared/model/errorCode.policy";
import { HANDLED_CODES } from "@/features/memberAdmin/consts/memberAdmin.const";

export function isUnexpectedWriteError(error: Error | null): boolean {
  return error !== null && !HANDLED_CODES.includes(errorCodeOf(error) ?? "");
}
