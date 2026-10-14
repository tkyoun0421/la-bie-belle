import { LOGIN_PATH } from "@/shared/consts/navigation.const";
import { redirectNativeIntentPath } from "@/features/auth/model/nativeIntent.policy";

describe("redirectNativeIntentPath — 구글이 돌아오는 주소는 로그인으로 돌린다", () => {
  it.each([
    "labiebelle://auth/callback?code=x",
    "exp://192.168.0.10:8081/--/auth/callback?code=x",
    "/auth/callback",
    "/auth/callback?code=x",
  ])("%s는 LOGIN_PATH다", (path) => {
    expect(redirectNativeIntentPath(path)).toBe(LOGIN_PATH);
  });
});

describe("redirectNativeIntentPath — 그 밖의 주소는 건드리지 않는다", () => {
  it.each([
    "/pending",
    "/login",
    "labiebelle://__test/session?x=1",
    "/auth/callbackfoo",
  ])("%s는 입력 그대로다", (path) => {
    expect(redirectNativeIntentPath(path)).toBe(path);
  });
});
