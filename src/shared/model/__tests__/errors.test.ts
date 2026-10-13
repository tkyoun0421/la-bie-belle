import { DomainError, TransportError } from "@/shared/model/errors";

describe("DomainError — 업무 규칙이 막은 오류", () => {
  it("코드를 필드와 메시지로 든다", () => {
    const error = new DomainError("already_assigned");

    expect(error.code).toBe("already_assigned");
    expect(error.message).toBe("already_assigned");
    expect(error.name).toBe("DomainError");
  });

  it("DomainError와 Error의 인스턴스다", () => {
    const error = new DomainError("already_assigned");

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("TransportError는 아니다", () => {
    expect(new DomainError("already_assigned")).not.toBeInstanceOf(
      TransportError,
    );
  });
});

describe("TransportError — 통신이 실패한 오류", () => {
  it("메시지와 원인을 필드로 든다", () => {
    const origin = { status: 503 };
    const error = new TransportError("network down", origin);

    expect(error.message).toBe("network down");
    expect(error.origin).toBe(origin);
    expect(error.name).toBe("TransportError");
  });

  it("TransportError와 Error의 인스턴스다", () => {
    const error = new TransportError("network down", null);

    expect(error).toBeInstanceOf(TransportError);
    expect(error).toBeInstanceOf(Error);
  });

  it("DomainError는 아니다", () => {
    expect(new TransportError("network down", null)).not.toBeInstanceOf(
      DomainError,
    );
  });
});
