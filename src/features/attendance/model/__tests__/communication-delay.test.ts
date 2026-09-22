import { isCommunicationDelayed } from "@/features/attendance/model/communication-delay";

describe("isCommunicationDelayed — 누른 시각과 닿은 시각이 5분 넘게 다르면 참이다(ATT-017)", () => {
  it("차이가 없으면 지연이 아니다", () => {
    const delayed = isCommunicationDelayed({
      reportedAt: "2026-09-10T01:00:00.000Z",
      receivedAt: "2026-09-10T01:00:00.000Z",
    });

    expect(delayed).toBe(false);
  });

  it("차이가 정확히 5분이면 지연이 아니다 — 경계 동일", () => {
    const delayed = isCommunicationDelayed({
      reportedAt: "2026-09-10T01:00:00.000Z",
      receivedAt: "2026-09-10T01:05:00.000Z",
    });

    expect(delayed).toBe(false);
  });

  it("차이가 5분 1초를 넘기면 지연이다", () => {
    const delayed = isCommunicationDelayed({
      reportedAt: "2026-09-10T01:00:00.000Z",
      receivedAt: "2026-09-10T01:05:01.000Z",
    });

    expect(delayed).toBe(true);
  });
});
