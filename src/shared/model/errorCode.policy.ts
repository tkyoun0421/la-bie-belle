import { DomainError, type ErrorCode } from "@/shared/model/error.type";

export function errorCodeOf(error: Error | null): ErrorCode | null {
  return error instanceof DomainError ? error.code : null;
}
