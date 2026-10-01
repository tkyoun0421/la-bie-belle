import { type ERROR_CODES } from "@/shared/consts/error.const";

/**
 * 오류를 둘로 가른 꼴이다. 코드 목록에 있는 것은 업무가 거절한 것이고(`DomainError`)
 * 그 밖은 통신이 끊긴 것이다(`TransportError`). 화면이 무엇을 보여줄지가 이 가름에 달렸다.
 *
 * `api`가 아니라 `model`에 사는 이유는 Supabase를 몰라도 서는 판정이기 때문이다 — 통신
 * 객체를 받아 이 둘로 옮기는 손만 `api`에 남는다(`shared/api/errors.ts`).
 */

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
