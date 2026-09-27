import { readAppUrl } from "@/shared/lib/read-app-url";

const original = new Map<string, string | undefined>();

function assign(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function stubEnv(name: string, value: string | undefined) {
  if (!original.has(name)) {
    original.set(name, process.env[name]);
  }

  assign(name, value);
}

afterEach(() => {
  for (const [name, value] of original) {
    assign(name, value);
  }

  original.clear();
});

describe("readAppUrl — 앱 주소 env를 읽는다", () => {
  it("값이 있으면 그대로 돌려준다", () => {
    stubEnv("EXPO_PUBLIC_APP_URL", "https://example.com");

    expect(readAppUrl()).toBe("https://example.com");
  });

  it("undefined면 던진다", () => {
    stubEnv("EXPO_PUBLIC_APP_URL", undefined);

    expect(() => readAppUrl()).toThrow(
      "환경 변수 EXPO_PUBLIC_APP_URL 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  });

  it("빈 문자열이면 던진다", () => {
    stubEnv("EXPO_PUBLIC_APP_URL", "");

    expect(() => readAppUrl()).toThrow(
      "환경 변수 EXPO_PUBLIC_APP_URL 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  });
});
