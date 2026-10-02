// 구현 대상: src/screens/scheduleWorker/model/answerFailure.policy.ts
//
// 근무 요청에 답하다 실패했을 때 시트를 닫을지 열어 둘지를 가른다. 화면이
// `error instanceof DomainError && error.code === "slot_full"`을 직접 적고 있던 자리다.
//
// **둘이 다른 실패다.** 늦은 수락은 되살아나지 않아 시트를 붙잡아 둘 일이 없고, 통신이
// 끊긴 것은 다시 누를 자리가 시트 안이라 열어 둬야 한다. 한 말(`failed`)로 접으면
// controller가 둘을 다시 가를 수 없다.

const { DomainError } = await import("@/shared/model/error.type");
const { answerFailure } =
  await import("@/screens/scheduleWorker/model/answerFailure.policy");

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
