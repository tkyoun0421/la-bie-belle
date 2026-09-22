import { ERROR_CODES } from "@/shared/api/error-codes";

export type ErrorCode = (typeof ERROR_CODES)[number];

const KNOWN_CODES: ReadonlySet<string> = new Set(ERROR_CODES);

export class DomainError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = "DomainError";
    this.code = code;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export class TransportError extends Error {
  readonly origin: unknown;

  constructor(message: string, origin: unknown) {
    super(message);
    this.name = "TransportError";
    this.origin = origin;
    Object.setPrototypeOf(this, TransportError.prototype);
  }
}

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
