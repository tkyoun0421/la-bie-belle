import { ERROR_CODES } from "@/shared/consts/error.const";
import {
  DomainError,
  type ErrorCode,
  TransportError,
} from "@/shared/model/error.type";

/**
 * Supabase가 돌려준 무엇이든 받아 `model`의 오류 둘 중 하나로 옮긴다. 통신 객체를 아는
 * 손이라 `api`에 남는다 — 가름의 꼴 자체는 `shared/model/error.type.ts`가 든다.
 */

const KNOWN_CODES: ReadonlySet<string> = new Set(ERROR_CODES);

const UNKNOWN_TRANSPORT_MESSAGE = "통신이 끊겼다";

function messageOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const { message } = error as { message?: unknown };

  return typeof message === "string" && message !== "" ? message : null;
}

export function toApiError(error: unknown): DomainError | TransportError {
  const message = messageOf(error);

  if (message !== null && KNOWN_CODES.has(message)) {
    return new DomainError(message as ErrorCode);
  }

  return new TransportError(message ?? UNKNOWN_TRANSPORT_MESSAGE, error);
}
