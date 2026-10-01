// 구현 대상: src/screens/schedule-admin/model/slot-request-badge.ts
//
// 날 상세 자리 카드의 요청 대기 배지다(schedule-admin.md 「포지션과 자리」·「날 상세
// 문안」의 「요청 2건 대기 중」). 살아 있는 요청의 pending 후보 수를 센다 — 닫힌
// 요청(`closed_at`이 있다)은 [AC-03]이 이미 지웠으니 배지가 없다.

import { slotRequestBadge } from "@/screens/schedule-admin/model/slot-request-badge";

describe("slotRequestBadge — pending 후보 수를 「요청 n건 대기 중」으로 말한다", () => {
  it("살아 있는 요청에 pending 후보가 둘이면 「요청 2건 대기 중」이다", () => {
    const badge = slotRequestBadge({
      closed_at: null,
      candidates: [{ status: "pending" }, { status: "pending" }],
    });

    expect(badge).toBe("요청 2건 대기 중");
  });

  it("거절한 후보는 안 센다", () => {
    const badge = slotRequestBadge({
      closed_at: null,
      candidates: [{ status: "pending" }, { status: "declined" }],
    });

    expect(badge).toBe("요청 1건 대기 중");
  });
});

describe("slotRequestBadge — 닫힌 요청은 null이다", () => {
  it("closed_at이 있으면 pending 후보가 남아 있어도 null이다", () => {
    const badge = slotRequestBadge({
      closed_at: "2026-10-10T00:00:00Z",
      candidates: [{ status: "pending" }],
    });

    expect(badge).toBeNull();
  });
});

describe("slotRequestBadge — 요청 자체가 없으면 null이다", () => {
  it("null을 받으면 null을 낸다", () => {
    expect(slotRequestBadge(null)).toBeNull();
  });
});
