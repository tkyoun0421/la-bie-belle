// 구현 대상: src/screens/scheduleAdmin/model/adjustmentFailure.policy.ts
//
// `set_adjustment`·`set_holiday`가 실패했을 때 시트가 할 일이다(payroll-adjust 상태 격자
// 「실패」). `not_allowed`는 그날 배정이 사라진 것이라 시트를 다시 읽는다. 그 밖은
// 시트를 열어둔 채 「보내지 못했어요. 다시 시도해주세요」를 띄우고 넣던 값을 남긴다 —
// 값을 남기는 것은 화면이 입력을 안 지우는 것이라 이 판정 밖이고, 여기서는 다시 읽을지와
// 보여줄 문구만 낸다.

import { DomainError, TransportError } from "@/shared/model/error.type";
import { adjustmentFailureAction } from "@/screens/scheduleAdmin/model/adjustmentFailure.policy";

describe("adjustmentFailureAction — not_allowed는 시트를 다시 읽는다", () => {
  it("refetch가 true고 띄울 문구가 없다", () => {
    const action = adjustmentFailureAction(new DomainError("not_allowed"));

    expect(action).toEqual({ refetch: true, message: null });
  });
});

describe("adjustmentFailureAction — 통신이 끊기면 시트를 열어둔 채 문구를 띄운다", () => {
  it("refetch가 false고 문구가 「보내지 못했어요. 다시 시도해주세요」다", () => {
    const action = adjustmentFailureAction(
      new TransportError("통신이 끊겼다", null),
    );

    expect(action).toEqual({
      refetch: false,
      message: "보내지 못했어요. 다시 시도해주세요",
    });
  });
});

describe("adjustmentFailureAction — not_allowed가 아닌 다른 거절도 시트를 열어둔다", () => {
  it("refetch가 false고 같은 문구가 뜬다", () => {
    const action = adjustmentFailureAction(new DomainError("bad_count"));

    expect(action).toEqual({
      refetch: false,
      message: "보내지 못했어요. 다시 시도해주세요",
    });
  });
});
