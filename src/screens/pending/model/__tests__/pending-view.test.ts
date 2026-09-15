import { describe, expect, it } from "vitest";
import { resolvePendingView } from "@/screens/pending/model/pending-view";

describe("resolvePendingView — 프로필 행으로 세 모습을 가른다", () => {
  it("프로필 행이 없으면 프로필 작성이다", () => {
    expect(resolvePendingView(null)).toBe("form");
  });

  it("제출 시각이 없으면 프로필 작성이다", () => {
    expect(resolvePendingView({ submitted_at: null, rejected_at: null })).toBe(
      "form",
    );
  });

  it("거절 시각이 있으면 거절된 뒤다", () => {
    expect(
      resolvePendingView({
        submitted_at: "2026-09-01T00:00:00.000Z",
        rejected_at: "2026-09-05T00:00:00.000Z",
      }),
    ).toBe("rejected");
  });

  it("제출됐고 거절되지 않았으면 기다리는 중이다", () => {
    expect(
      resolvePendingView({
        submitted_at: "2026-09-01T00:00:00.000Z",
        rejected_at: null,
      }),
    ).toBe("waiting");
  });
});
