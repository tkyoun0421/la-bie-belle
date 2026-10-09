const { DomainError } = await import("@/shared/model/error.type");
const { answerFailure } =
  await import("@/features/workRequest/model/answerFailure.policy");

describe("answerFailure — 늦은 수락과 끊긴 통신을 가른다", () => {
  it("실패가 없으면 아무것도 아니다", () => {
    expect(answerFailure(null)).toBeNull();
  });

  it("자리가 찼다는 거절은 늦은 수락이다", () => {
    expect(answerFailure(new DomainError("slot_full"))).toBe("seat_taken");
  });

  it("업무가 거절했어도 코드가 다르면 늦은 수락이 아니다", () => {
    expect(answerFailure(new DomainError("request_closed"))).toBe(
      "unreachable",
    );
  });

  it("코드가 없는 오류는 통신이 끊긴 것이다", () => {
    expect(answerFailure(new Error("끊겼다"))).toBe("unreachable");
  });
});
