import { ERROR_CODES } from "@/shared/api/error-codes";
import { DomainError, TransportError, toApiError } from "@/shared/api/errors";

describe("toApiError — 오류 메시지가 코드 목록에 있으면 DomainError, 그 밖은 전부 TransportError다", () => {
  it("메시지가 코드 목록에 있으면 DomainError로 가른다", () => {
    const knownCode = ERROR_CODES[0];

    const error = toApiError({ message: knownCode });

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe(knownCode);
  });

  it("메시지가 코드 목록에 없으면 TransportError로 가른다", () => {
    const error = toApiError({ message: "연결이 끊겼다" });

    expect(error).toBeInstanceOf(TransportError);
  });

  it("메시지가 없는 오류도 TransportError로 가른다", () => {
    const error = toApiError(new Error());

    expect(error).toBeInstanceOf(TransportError);
  });

  it("오류가 아닌 값이 와도 TransportError로 가른다", () => {
    const error = toApiError(undefined);

    expect(error).toBeInstanceOf(TransportError);
  });
});
