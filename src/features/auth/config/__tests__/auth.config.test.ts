import { jest } from "@jest/globals";

/**
 * 구현 대상: src/features/auth/config/auth.config.ts
 *
 * 딥링크 주소를 만들려면 「지금 무엇이 앱을 돌리고 있나」를 알아야 한다. Expo Go는 번들을
 * 내려받아 대신 돌리는 껍데기라 제 스킴이 없고, dev client와 스토어 빌드는 제 스킴을 가진다.
 * 그 답은 환경이 주는 값이라 `config`가 읽고, 주소를 짜는 일은
 * `utils/authRedirect.utils.ts`가 한다.
 */

type ConstantsState = {
  executionEnvironment: string;
  expoConfig?: { hostUri?: string };
};

async function loadWith(state: ConstantsState) {
  jest.resetModules();
  jest.unstable_mockModule("expo-constants", () => ({ default: state }));

  return await import("@/features/auth/config/auth.config");
}

describe("readIsExpoGo — Expo Go 껍데기 안에서 돌고 있나", () => {
  it("storeClient면 참이다", async () => {
    const { readIsExpoGo } = await loadWith({
      executionEnvironment: "storeClient",
    });

    expect(readIsExpoGo()).toBe(true);
  });

  it("standalone이면 거짓이다 — 스토어 빌드는 제 스킴을 가진다", async () => {
    const { readIsExpoGo } = await loadWith({
      executionEnvironment: "standalone",
    });

    expect(readIsExpoGo()).toBe(false);
  });

  it("storeClient가 아닌 어떤 값이어도 거짓이다", async () => {
    const { readIsExpoGo } = await loadWith({
      executionEnvironment: "bare",
    });

    expect(readIsExpoGo()).toBe(false);
  });
});

describe("readExpoHostUri — Expo Go 껍데기가 뜬 주소", () => {
  it("값이 있으면 그대로 돌려준다", async () => {
    const { readExpoHostUri } = await loadWith({
      executionEnvironment: "storeClient",
      expoConfig: { hostUri: "192.168.0.10:8081" },
    });

    expect(readExpoHostUri()).toBe("192.168.0.10:8081");
  });

  it("설정이 없으면 undefined다", async () => {
    const { readExpoHostUri } = await loadWith({
      executionEnvironment: "standalone",
    });

    expect(readExpoHostUri()).toBeUndefined();
  });
});
