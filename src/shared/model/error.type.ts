import { type ERROR_CODES } from "@/shared/consts/error.const";

export type ErrorCode = (typeof ERROR_CODES)[number];

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
