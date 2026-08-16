import { describe, expect, it } from "vitest";

import { shouldShowPushPriming } from "@/features/push/model/push-priming";

const BASE_INPUT = {
  applicationSaved: true,
  subscribed: false,
  permissionDenied: false,
  alreadyShown: false,
};

describe("shouldShowPushPriming", () => {
  it("신청 저장 성공 + 미구독 + 권한 미거부 + 기노출 아님이면 true다", () => {
    expect(shouldShowPushPriming(BASE_INPUT)).toBe(true);
  });

  it("신청 저장이 성공하지 않았으면 false다", () => {
    expect(shouldShowPushPriming({ ...BASE_INPUT, applicationSaved: false })).toBe(false);
  });

  it("이미 구독 중이면 false다", () => {
    expect(shouldShowPushPriming({ ...BASE_INPUT, subscribed: true })).toBe(false);
  });

  it("권한이 거부됐으면 false다", () => {
    expect(shouldShowPushPriming({ ...BASE_INPUT, permissionDenied: true })).toBe(false);
  });

  it("이미 한 번 노출됐으면 false다", () => {
    expect(shouldShowPushPriming({ ...BASE_INPUT, alreadyShown: true })).toBe(false);
  });

  it("여러 거부 조건이 겹쳐도 false다", () => {
    expect(
      shouldShowPushPriming({
        applicationSaved: true,
        subscribed: true,
        permissionDenied: true,
        alreadyShown: true,
      }),
    ).toBe(false);
  });
});
