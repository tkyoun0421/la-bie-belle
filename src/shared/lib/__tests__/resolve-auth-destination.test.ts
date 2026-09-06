import { describe, expect, it } from "vitest";
import { resolveAuthDestination } from "@/shared/lib/resolve-auth-destination";

describe("resolveAuthDestination — 세션과 승인 시각으로 목적지를 가른다", () => {
  it("세션이 없으면 로그인 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: false,
      approvedAt: null,
    });

    expect(destination).toBe("/login");
  });

  it("세션이 없으면 승인 시각이 차 있어도 로그인 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: false,
      approvedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(destination).toBe("/login");
  });

  it("세션이 있고 승인 시각이 비어 있으면 승인 대기 화면으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      approvedAt: null,
    });

    expect(destination).toBe("/pending");
  });

  it("세션이 있고 승인 시각이 차 있으면 홈으로 보낸다", () => {
    const destination = resolveAuthDestination({
      hasSession: true,
      approvedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(destination).toBe("/");
  });
});
