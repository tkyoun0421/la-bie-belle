import { errorCodeOf } from "@/shared/model/errorCode.policy";
import { HANDLED_CODES } from "@/screens/members/consts/members.const";

export function isUnexpectedWriteError(error: Error | null): boolean {
  return error !== null && !HANDLED_CODES.includes(errorCodeOf(error) ?? "");
}
