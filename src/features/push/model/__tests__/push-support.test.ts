import { describe, expect, it } from "vitest";

import { resolvePushSupportState } from "@/features/push/model/push-support";

const BASE_INPUT = {
  pushApiSupported: true,
  isIos: false,
  isStandalone: false,
  permission: "default" as NotificationPermission,
  subscribed: false,
};

describe("resolvePushSupportState", () => {
  it("push API를 지원하지 않으면 unsupported다", () => {
    expect(resolvePushSupportState({ ...BASE_INPUT, pushApiSupported: false })).toBe("unsupported");
  });

  it("iOS인데 홈 화면 설치가 아니면 ios-not-installed다", () => {
    expect(resolvePushSupportState({ ...BASE_INPUT, isIos: true, isStandalone: false })).toBe(
      "ios-not-installed",
    );
  });

  it("iOS이면서 홈 화면 설치(standalone)면 ios-not-installed가 아니다", () => {
    expect(resolvePushSupportState({ ...BASE_INPUT, isIos: true, isStandalone: true })).not.toBe(
      "ios-not-installed",
    );
  });

  it("권한이 거부됐으면 permission-denied다", () => {
    expect(resolvePushSupportState({ ...BASE_INPUT, permission: "denied" })).toBe(
      "permission-denied",
    );
  });

  it("이미 구독 중이면 subscribed다", () => {
    expect(resolvePushSupportState({ ...BASE_INPUT, subscribed: true })).toBe("subscribed");
  });

  it("지원·설치·권한이 모두 문제없고 미구독이면 ready다", () => {
    expect(resolvePushSupportState(BASE_INPUT)).toBe("ready");
  });

  it("우선순위: 미지원이 iOS 미설치보다 앞선다", () => {
    expect(
      resolvePushSupportState({
        ...BASE_INPUT,
        pushApiSupported: false,
        isIos: true,
        isStandalone: false,
      }),
    ).toBe("unsupported");
  });

  it("우선순위: iOS 미설치가 권한 거부보다 앞선다", () => {
    expect(
      resolvePushSupportState({
        ...BASE_INPUT,
        isIos: true,
        isStandalone: false,
        permission: "denied",
      }),
    ).toBe("ios-not-installed");
  });

  it("우선순위: 권한 거부가 구독 여부보다 앞선다", () => {
    expect(resolvePushSupportState({ ...BASE_INPUT, permission: "denied", subscribed: true })).toBe(
      "permission-denied",
    );
  });
});
