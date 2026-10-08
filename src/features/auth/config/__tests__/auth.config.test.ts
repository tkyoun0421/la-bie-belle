import { jest } from "@jest/globals";

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
