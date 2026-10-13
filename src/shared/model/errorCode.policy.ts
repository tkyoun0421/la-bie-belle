import type { ErrorCode } from "@/shared/model/error.type";
import { DomainError } from "@/shared/model/errors";

export function errorCodeOf(error: Error | null): ErrorCode | null {
  return error instanceof DomainError ? error.code : null;
}
