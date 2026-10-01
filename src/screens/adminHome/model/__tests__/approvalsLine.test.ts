// 구현 대상: src/screens/admin-home/model/approvalsLine.ts
//
// 「승인할 일」 줄의 문구다(admin-home.md 「관리자 홈 문안」의 「승인할 일 · 3건」).
// 이 task는 근무 취소 대기 건수로 이 줄을 켠다 — `usePendingApprovals`의 길이다(plan
// schedule-requests.md 「총괄이 정한 것」 7). 사유 건수는 attendance가 같은 훅에
// 더한다. 0건이어도 「0건」으로 선다 — 가입 대기 줄과 같은 규칙이다.

import { approvalsLine } from "@/screens/admin-home/model/approvalsLine";

describe("approvalsLine — 대기 건수를 「승인할 일 · n건」으로 말한다", () => {
  it("3건이면 「승인할 일 · 3건」이다", () => {
    expect(approvalsLine(3)).toBe("승인할 일 · 3건");
  });

  it("0건이어도 줄은 선다 — 「승인할 일 · 0건」이다", () => {
    expect(approvalsLine(0)).toBe("승인할 일 · 0건");
  });
});
