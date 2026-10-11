import { ERROR_CODES } from "@/shared/consts/error.const";
import { DomainError, TransportError } from "@/shared/model/error.type";
import { memberOf } from "@/shared/model/memberOf.policy";

const isErrorCode = memberOf(ERROR_CODES);

const UNKNOWN_TRANSPORT_MESSAGE = "통신이 끊겼다";

function messageOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return null;
  }

  const { message } = error;

  return typeof message === "string" && message !== "" ? message : null;
}

export function toApiError(error: unknown): DomainError | TransportError {
  const message = messageOf(error);

  if (message !== null && isErrorCode(message)) {
    return new DomainError(message);
  }

  return new TransportError(message ?? UNKNOWN_TRANSPORT_MESSAGE, error);
}
