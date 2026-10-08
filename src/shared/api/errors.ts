import { ERROR_CODES } from "@/shared/consts/error.const";
import {
  DomainError,
  type ErrorCode,
  TransportError,
} from "@/shared/model/error.type";

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
