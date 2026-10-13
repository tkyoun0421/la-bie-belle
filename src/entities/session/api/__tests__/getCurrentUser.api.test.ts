import {
  AuthError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  type User,
} from "@supabase/supabase-js";
import type { DB } from "@/shared/api/database";
import { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";

function fakeClient(getUserResult: {
  data: { user: User | null };
  error: Error | null;
}): DB {
  return {
    auth: {
      getUser: async () => getUserResult,
    },
  } as unknown as DB;
}

const FAKE_USER = { id: "user-1", email: "person@example.com" } as User;

describe("getCurrentUser — 지금 로그인한 사람을 읽는다", () => {
  it("Auth가 사람을 돌려주면 그 사람을 그대로 돌려준다", async () => {
    const client = fakeClient({ data: { user: FAKE_USER }, error: null });

    const result = await getCurrentUser(client);

    expect(result).toEqual(FAKE_USER);
  });

  it("Auth가 사람 없이 돌아오면 빈 값을 돌려준다", async () => {
    const client = fakeClient({ data: { user: null }, error: null });

    const result = await getCurrentUser(client);

    expect(result).toBeNull();
  });

  it("세션 없음 오류면 빈 값을 돌려준다 — 로그아웃 상태다", async () => {
    const client = fakeClient({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });

    const result = await getCurrentUser(client);

    expect(result).toBeNull();
  });

  it("통신 오류면 빈 값으로 접지 않고 던진다", async () => {
    const client = fakeClient({
      data: { user: null },
      error: new AuthRetryableFetchError("network down", 0),
    });

    await expect(getCurrentUser(client)).rejects.toBeDefined();
  });

  it("세션 없음이 아닌 일반 Auth 오류도 던진다", async () => {
    const client = fakeClient({
      data: { user: null },
      error: new AuthError("invalid token"),
    });

    await expect(getCurrentUser(client)).rejects.toBeDefined();
  });
});
