import { describe, expect, it } from "vitest";

import { PUBLIC_PATHS, resolveAuthRedirect } from "@/shared/lib/route-access";

describe("resolveAuthRedirect", () => {
  it("미인증 사용자가 보호 라우트에 접근하면 /login으로 보낸다", () => {
    expect(resolveAuthRedirect("/", false)).toBe("/login");
    expect(resolveAuthRedirect("/schedule", false)).toBe("/login");
    expect(resolveAuthRedirect("/onboarding", false)).toBe("/login");
  });

  it("인증 사용자가 /login에 접근하면 홈으로 보낸다", () => {
    expect(resolveAuthRedirect("/login", true)).toBe("/");
  });

  it("인증 사용자의 보호 라우트 접근은 리다이렉트하지 않는다", () => {
    expect(resolveAuthRedirect("/", true)).toBeNull();
    expect(resolveAuthRedirect("/schedule", true)).toBeNull();
    expect(resolveAuthRedirect("/onboarding", true)).toBeNull();
  });

  it("미인증 사용자의 공개 경로 접근은 리다이렉트하지 않는다", () => {
    expect(resolveAuthRedirect("/login", false)).toBeNull();
    expect(resolveAuthRedirect("/auth/callback", false)).toBeNull();
    expect(resolveAuthRedirect("/preview", false)).toBeNull();
    expect(resolveAuthRedirect("/catalog", false)).toBeNull();
  });

  it("공개 경로의 하위 경로도 공개로 취급한다", () => {
    expect(resolveAuthRedirect("/auth/callback/extra", false)).toBeNull();
  });

  it("공개 경로 접두어만 같은 다른 경로는 보호 대상이다", () => {
    expect(resolveAuthRedirect("/login-history", false)).toBe("/login");
    expect(resolveAuthRedirect("/preview-mode", false)).toBe("/login");
  });

  it("공개 경로 목록을 export한다", () => {
    expect(PUBLIC_PATHS).toContain("/login");
    expect(PUBLIC_PATHS).toContain("/auth/callback");
    expect(PUBLIC_PATHS).toContain("/preview");
    expect(PUBLIC_PATHS).toContain("/catalog");
  });
});
