import { describe, expect, it } from "vitest";

import { resolveProfileAccess, resolveProfileGate } from "@/entities/identity/model/profile-gate";
import {
  DEPARTED_PATH,
  DORMANT_PATH,
  HOME_PATH,
  LOGIN_PATH,
  ONBOARDING_PATH,
  PENDING_PATH,
  REJECTED_PATH,
} from "@/shared/config/auth-routes.config";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

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

  it("rejected 사용자가 /rejected에 있으면 통과시킨다", () => {
    expect(resolveProfileGate({ status: "rejected" }, REJECTED_PATH)).toBeNull();
  });

  it("rejected 사용자가 보호 탭에 있으면 /rejected로 보낸다", () => {
    expect(resolveProfileGate({ status: "rejected" }, HOME_PATH)).toBe(REJECTED_PATH);
  });

  it("rejected 사용자가 /pending에 있으면 /rejected로 보낸다(임시 합류 제거)", () => {
    expect(resolveProfileGate({ status: "rejected" }, PENDING_PATH)).toBe(REJECTED_PATH);
  });

  it("rejected 사용자가 /onboarding에 있으면 /rejected로 보낸다", () => {
    expect(resolveProfileGate({ status: "rejected" }, ONBOARDING_PATH)).toBe(REJECTED_PATH);
  });

  it("pending 사용자가 /rejected에 있으면 /pending으로 보낸다", () => {
    expect(resolveProfileGate({ status: "pending" }, REJECTED_PATH)).toBe(PENDING_PATH);
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

  it("active 사용자가 /rejected에 있으면 홈으로 보낸다", () => {
    expect(resolveProfileGate({ status: "active" }, REJECTED_PATH)).toBe(HOME_PATH);
  });

  it("active 사용자가 /dormant에 있으면 홈으로 보낸다", () => {
    expect(resolveProfileGate({ status: "active" }, DORMANT_PATH)).toBe(HOME_PATH);
  });

  it("active 사용자가 /departed에 있으면 홈으로 보낸다", () => {
    expect(resolveProfileGate({ status: "active" }, DEPARTED_PATH)).toBe(HOME_PATH);
  });

  it("dormant 사용자가 /dormant에 있으면 통과시킨다", () => {
    expect(resolveProfileGate({ status: "dormant" }, DORMANT_PATH)).toBeNull();
  });

  it("dormant 사용자가 보호 탭에 있으면 /dormant로 보낸다", () => {
    expect(resolveProfileGate({ status: "dormant" }, HOME_PATH)).toBe(DORMANT_PATH);
  });

  it("dormant 사용자가 /departed에 있으면 /dormant로 보낸다", () => {
    expect(resolveProfileGate({ status: "dormant" }, DEPARTED_PATH)).toBe(DORMANT_PATH);
  });

  it("departed 사용자가 /departed에 있으면 통과시킨다", () => {
    expect(resolveProfileGate({ status: "departed" }, DEPARTED_PATH)).toBeNull();
  });

  it("departed 사용자가 보호 탭에 있으면 /departed로 보낸다", () => {
    expect(resolveProfileGate({ status: "departed" }, HOME_PATH)).toBe(DEPARTED_PATH);
  });

  it("departed 사용자가 /dormant에 있으면 /departed로 보낸다", () => {
    expect(resolveProfileGate({ status: "departed" }, DORMANT_PATH)).toBe(DEPARTED_PATH);
  });
});

describe("resolveProfileAccess", () => {
  it("인증이 필요한 실패는 /login으로 리다이렉트한다", () => {
    expect(
      resolveProfileAccess({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED }, HOME_PATH),
    ).toEqual({ kind: "redirect", to: LOGIN_PATH });
  });

  it.each([
    ERROR_CODE.COMMON_UNEXPECTED,
    ERROR_CODE.COMMON_FORBIDDEN,
    ERROR_CODE.COMMON_NOT_FOUND,
    ERROR_CODE.IDENTITY_VALIDATION,
    ERROR_CODE.IDENTITY_PROFILE_EXISTS,
    ERROR_CODE.IDENTITY_PHONE_TAKEN,
    ERROR_CODE.IDENTITY_PROFILE_REQUIRED,
    ERROR_CODE.IDENTITY_NOT_ACTIVE,
  ])(
    "인증 필요가 아닌 조회 실패(%s)는 리다이렉트하지 않고 오류 화면으로만 처리한다(무한 루프 방지)",
    (code) => {
      expect(resolveProfileAccess({ ok: false, code }, HOME_PATH)).toEqual({ kind: "error" });
    },
  );

  it("조회 성공 + 통과 대상이면 allow를 반환한다", () => {
    expect(resolveProfileAccess({ ok: true, data: { status: "active" } }, HOME_PATH)).toEqual({
      kind: "allow",
    });
  });

  it("조회 성공 + 리다이렉트 대상이면 redirect를 반환한다", () => {
    expect(resolveProfileAccess({ ok: true, data: { status: "pending" } }, HOME_PATH)).toEqual({
      kind: "redirect",
      to: PENDING_PATH,
    });
  });

  it("조회 성공 + rejected면 /rejected로 redirect를 반환한다", () => {
    expect(resolveProfileAccess({ ok: true, data: { status: "rejected" } }, HOME_PATH)).toEqual({
      kind: "redirect",
      to: REJECTED_PATH,
    });
  });

  it("조회 성공 + dormant면 /dormant로 redirect를 반환한다", () => {
    expect(resolveProfileAccess({ ok: true, data: { status: "dormant" } }, HOME_PATH)).toEqual({
      kind: "redirect",
      to: DORMANT_PATH,
    });
  });

  it("조회 성공 + departed면 /departed로 redirect를 반환한다", () => {
    expect(resolveProfileAccess({ ok: true, data: { status: "departed" } }, HOME_PATH)).toEqual({
      kind: "redirect",
      to: DEPARTED_PATH,
    });
  });

  it("조회 성공 + 무프로필이면 gate 규칙을 그대로 따른다", () => {
    expect(resolveProfileAccess({ ok: true, data: null }, HOME_PATH)).toEqual({
      kind: "redirect",
      to: ONBOARDING_PATH,
    });
  });
});
