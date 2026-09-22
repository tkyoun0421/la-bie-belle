import { jest } from "@jest/globals";

const constantsState: {
  executionEnvironment: string;
  expoConfig?: { hostUri?: string };
} = {
  executionEnvironment: "storeClient",
};

jest.unstable_mockModule("expo-constants", () => ({
  default: constantsState,
}));

const { makeAuthRedirectUri, extractAuthCode } =
  await import("@/shared/lib/auth-redirect");

describe("makeAuthRedirectUri — 실행 환경마다 다른 딥링크 주소를 만든다", () => {
  it("Expo Go(storeClient)에서는 exp://<호스트>/--/<경로> 꼴이다", () => {
    constantsState.executionEnvironment = "storeClient";
    constantsState.expoConfig = { hostUri: "192.168.0.10:8081" };

    const uri = makeAuthRedirectUri("auth/callback");

    expect(uri).toBe("exp://192.168.0.10:8081/--/auth/callback");
  });

  it("dev client·스토어 빌드(standalone)에서는 labiebelle://<경로> 꼴이다", () => {
    constantsState.executionEnvironment = "standalone";
    constantsState.expoConfig = undefined;

    const uri = makeAuthRedirectUri("auth/callback");

    expect(uri).toBe("labiebelle://auth/callback");
  });
});

describe("extractAuthCode — 콜백 주소에서 code 쿼리 값을 뽑는다", () => {
  it("code가 있으면 그 값을 돌려준다", () => {
    const code = extractAuthCode("labiebelle://auth/callback?code=abc");

    expect(code).toBe("abc");
  });

  it("code가 없으면 null이다", () => {
    const code = extractAuthCode("labiebelle://auth/callback");

    expect(code).toBeNull();
  });

  it("code 외에 다른 쿼리가 섞여 있어도 code만 뽑는다", () => {
    const code = extractAuthCode(
      "exp://192.168.0.10:8081/--/auth/callback?state=xyz&code=abc123",
    );

    expect(code).toBe("abc123");
  });
});
