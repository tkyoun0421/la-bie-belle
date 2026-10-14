import { jest } from "@jest/globals";

jest.unstable_mockModule("expo-constants", () => ({
  default: { executionEnvironment: "standalone" },
}));

const { signInWithGoogle } =
  await import("@/features/auth/lib/signInWithGoogle.lib");

const REDIRECT_URI = "labiebelle://auth/callback";
const OAUTH_URL =
  "https://project.supabase.co/auth/v1/authorize?provider=google";

type OAuthResult = {
  data: { url: string | null };
  error: { message: string } | null;
};
type WindowResult = { type: string; url?: string };

function setup({
  oauth = { data: { url: OAUTH_URL }, error: null },
  window = { type: "success", url: `${REDIRECT_URI}?code=abc` },
  exchangeError = null,
}: {
  oauth?: OAuthResult;
  window?: WindowResult;
  exchangeError?: { message: string } | null;
} = {}) {
  const signInWithOAuth = jest.fn(async (..._args: unknown[]) => oauth);
  const exchangeCodeForSession = jest.fn(async (..._args: unknown[]) => ({
    error: exchangeError,
  }));
  const openAuthSession = jest.fn(async (..._args: unknown[]) => window);
  const client = {
    auth: { signInWithOAuth, exchangeCodeForSession },
  } as never;

  return {
    signInWithOAuth,
    exchangeCodeForSession,
    openAuthSession,
    run: () =>
      signInWithGoogle({
        client,
        openAuthSession,
        redirectUri: REDIRECT_URI,
      }),
  };
}

describe("signInWithGoogle — 시작과 창이 같은 redirectTo를 받는다", () => {
  it("구글 provider로 브라우저 이동 없이 주소만 받아 달라고 한 번 부른다", async () => {
    const { run, signInWithOAuth } = setup();

    await run();

    expect(signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: REDIRECT_URI, skipBrowserRedirect: true },
    });
  });

  it("받은 주소를 앱 안 창으로 열고 창에도 같은 redirectTo를 준다", async () => {
    const { run, openAuthSession } = setup();

    await run();

    expect(openAuthSession).toHaveBeenCalledTimes(1);
    expect(openAuthSession).toHaveBeenCalledWith(OAUTH_URL, REDIRECT_URI);
  });
});

describe("signInWithGoogle — 시작을 못 하면 창을 열지 않는다", () => {
  it("signInWithOAuth가 error를 주면 start_failed다", async () => {
    const { run, openAuthSession } = setup({
      oauth: { data: { url: null }, error: { message: "boom" } },
    });

    await expect(run()).resolves.toEqual({
      ok: false,
      reason: "start_failed",
    });
    expect(openAuthSession).not.toHaveBeenCalled();
  });

  it("error 없이 url이 null이어도 start_failed다", async () => {
    const { run, openAuthSession } = setup({
      oauth: { data: { url: null }, error: null },
    });

    await expect(run()).resolves.toEqual({
      ok: false,
      reason: "start_failed",
    });
    expect(openAuthSession).not.toHaveBeenCalled();
  });
});

describe("signInWithGoogle — 창이 success가 아니면 닫은 것이다", () => {
  it.each(["cancel", "dismiss", "locked"])(
    "창이 %s면 cancelled고 교환을 안 부른다",
    async (type) => {
      const { run, exchangeCodeForSession } = setup({ window: { type } });

      await expect(run()).resolves.toEqual({
        ok: false,
        reason: "cancelled",
      });
      expect(exchangeCodeForSession).not.toHaveBeenCalled();
    },
  );
});

describe("signInWithGoogle — 돌아온 주소의 코드를 세션으로 바꾼다", () => {
  it("success의 주소에서 code를 꺼내 교환하고 ok를 돌려준다", async () => {
    const { run, exchangeCodeForSession } = setup();

    await expect(run()).resolves.toEqual({ ok: true });
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("주소에 code가 없으면 missing_code고 교환을 안 부른다", async () => {
    const { run, exchangeCodeForSession } = setup({
      window: { type: "success", url: `${REDIRECT_URI}?error=access_denied` },
    });

    await expect(run()).resolves.toEqual({
      ok: false,
      reason: "missing_code",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("쿼리 자체가 없는 주소도 missing_code다", async () => {
    const { run, exchangeCodeForSession } = setup({
      window: { type: "success", url: REDIRECT_URI },
    });

    await expect(run()).resolves.toEqual({
      ok: false,
      reason: "missing_code",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("교환이 error를 주면 exchange_failed다", async () => {
    const { run } = setup({ exchangeError: { message: "invalid_grant" } });

    await expect(run()).resolves.toEqual({
      ok: false,
      reason: "exchange_failed",
    });
  });
});
