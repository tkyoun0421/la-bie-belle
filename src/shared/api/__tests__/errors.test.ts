import { describe, expect, it } from "vitest";
import {
  DomainError,
  isDomainError,
  TransportError,
  toAppError,
} from "@/shared/api/errors";

const DOMAIN_CODES = [
  "not_allowed",
  "already_submitted",
  "already_approved",
  "invalid_gender",
  "invalid_phone",
] as const;

describe("toAppError — 목록에 있는 메시지는 DomainError다", () => {
  it.each(DOMAIN_CODES)(
    "메시지가 %s면 DomainError고 code가 그 값이다",
    (code) => {
      const result = toAppError({ message: code });

      expect(result).toBeInstanceOf(DomainError);
      expect((result as DomainError).code).toBe(code);
    },
  );
});

describe("toAppError — 목록 밖은 TransportError다", () => {
  it("목록에 없는 메시지는 TransportError고 원인을 보존한다", () => {
    const cause = { message: "network down" };

    const result = toAppError(cause);

    expect(result).toBeInstanceOf(TransportError);
    expect((result as TransportError).cause).toBe(cause);
  });

  it("message가 없는 객체는 TransportError다", () => {
    const cause = { detail: "no message field" };

    const result = toAppError(cause);

    expect(result).toBeInstanceOf(TransportError);
    expect((result as TransportError).cause).toBe(cause);
  });

  it("문자열 오류는 TransportError다", () => {
    const result = toAppError("timeout");

    expect(result).toBeInstanceOf(TransportError);
    expect((result as TransportError).cause).toBe("timeout");
  });

  it("null 오류는 TransportError다", () => {
    const result = toAppError(null);

    expect(result).toBeInstanceOf(TransportError);
    expect((result as TransportError).cause).toBeNull();
  });
});

describe("isDomainError — 코드까지 지정하면 그 코드인지도 본다", () => {
  it("DomainError고 코드가 같으면 참이다", () => {
    const error = toAppError({ message: "already_submitted" });

    expect(isDomainError(error, "already_submitted")).toBe(true);
  });

  it("DomainError지만 코드가 다르면 거짓이다", () => {
    const error = toAppError({ message: "already_submitted" });

    expect(isDomainError(error, "not_allowed")).toBe(false);
  });

  it("코드를 안 주면 DomainError인지만 본다", () => {
    const error = toAppError({ message: "not_allowed" });

    expect(isDomainError(error)).toBe(true);
  });

  it("TransportError면 코드 없이 물어도 거짓이다", () => {
    const error = toAppError("network down");

    expect(isDomainError(error)).toBe(false);
  });
});
