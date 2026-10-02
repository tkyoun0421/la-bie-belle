import { jest } from "@jest/globals";

/**
 * 구현 대상: src/features/pushSwitch/config/pushSwitch.config.ts
 *
 * `app.json`의 `extra.eas.projectId`를 읽는다. 아직 EAS 프로젝트를 안 만들어 그 열쇠가
 * 비어 있고, 그때 널로 서는 것이 「켰는데 기기가 없음」 갈래다
 * (`docs/3-build/plans/notification-settings.md`의 「이 plan이 정본에 박은 판정」).
 */

type ExpoConfig = { extra?: { eas?: { projectId?: string } } };

async function loadWith(expoConfig: ExpoConfig | null) {
  jest.resetModules();
  jest.unstable_mockModule("expo-constants", () => ({
    default: { expoConfig },
  }));

  const { readPushProjectId } =
    await import("@/features/pushSwitch/config/pushSwitch.config");

  return readPushProjectId;
}

describe("readPushProjectId — EAS 프로젝트 id를 읽는다", () => {
  it("값이 있으면 그대로 돌려준다", async () => {
    const readPushProjectId = await loadWith({
      extra: { eas: { projectId: "0000-0000" } },
    });

    expect(readPushProjectId()).toBe("0000-0000");
  });

  it("eas 열쇠가 없으면 널이다 — 던지지 않는다", async () => {
    const readPushProjectId = await loadWith({ extra: {} });

    expect(readPushProjectId()).toBeNull();
  });

  it("설정 자체가 없어도 널이다", async () => {
    const readPushProjectId = await loadWith(null);

    expect(readPushProjectId()).toBeNull();
  });
});
