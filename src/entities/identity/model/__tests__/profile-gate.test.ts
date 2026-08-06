import { describe, expect, it } from "vitest";

import { resolveProfileGate } from "@/entities/identity/model/profile-gate";
import { HOME_PATH, ONBOARDING_PATH, PENDING_PATH } from "@/shared/config/auth-routes.config";

describe("resolveProfileGate", () => {
  it("무프로필 사용자가 /onboarding에 있으면 통과시킨다", () => {
    expect(resolveProfileGate(null, ONBOARDING_PATH)).toBeNull();
  });

  it("무프로필 사용자가 보호 탭에 있으면 /onboarding으로 보낸다", () => {
    expect(resolveProfileGate(null, HOME_PATH)).toBe(ONBOARDING_PATH);
  });

  it("무프로필 사용자가 /pending에 있으면 /onboarding으로 보낸다", () => {
    expect(resolveProfileGate(null, PENDING_PATH)).toBe(ONBOARDING_PATH);
  });

  it("pending 사용자가 /pending에 있으면 통과시킨다", () => {
    expect(resolveProfileGate({ status: "pending" }, PENDING_PATH)).toBeNull();
  });

  it("pending 사용자가 보호 탭에 있으면 /pending으로 보낸다", () => {
    expect(resolveProfileGate({ status: "pending" }, HOME_PATH)).toBe(PENDING_PATH);
  });

  it("pending 사용자가 /onboarding에 있으면 /pending으로 보낸다", () => {
    expect(resolveProfileGate({ status: "pending" }, ONBOARDING_PATH)).toBe(PENDING_PATH);
  });

  it("rejected 사용자는 pending과 같은 대기 화면으로 보낸다(임시)", () => {
    expect(resolveProfileGate({ status: "rejected" }, HOME_PATH)).toBe(PENDING_PATH);
    expect(resolveProfileGate({ status: "rejected" }, PENDING_PATH)).toBeNull();
  });

  it("active 사용자가 보호 탭에 있으면 통과시킨다", () => {
    expect(resolveProfileGate({ status: "active" }, HOME_PATH)).toBeNull();
  });

  it("active 사용자가 /onboarding에 있으면 홈으로 보낸다", () => {
    expect(resolveProfileGate({ status: "active" }, ONBOARDING_PATH)).toBe(HOME_PATH);
  });

  it("active 사용자가 /pending에 있으면 홈으로 보낸다", () => {
    expect(resolveProfileGate({ status: "active" }, PENDING_PATH)).toBe(HOME_PATH);
  });
});
