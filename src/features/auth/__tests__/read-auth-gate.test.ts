import type { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { readAuthGate } from "@/features/auth/read-auth-gate";

type ProfileRow = { approved_at: string | null };

function fakeClient(options: {
  user: User | null;
  approvedAt?: string | null;
}): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: options.user }, error: null }),
    },
    from: (table: string) => {
      if (table !== "profiles") {
        throw new Error(`예상치 못한 테이블 조회: ${table}`);
      }

      return {
        select: (_columns: string) => ({
          eq: (_column: string, _value: string) => ({
            maybeSingle: async (): Promise<{
              data: ProfileRow | null;
              error: null;
            }> => ({
              data:
                options.approvedAt === undefined
                  ? null
                  : { approved_at: options.approvedAt },
              error: null,
            }),
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

function fakeUser(userMetadata: Record<string, unknown> = {}): User {
  return {
    id: "user-1",
    email: "person@example.com",
    user_metadata: userMetadata,
  } as unknown as User;
}

describe("readAuthGate — 로그인 여부와 승인 상태로 목적지를 정한다", () => {
  it("세션이 없으면 로그인 화면으로 보내고 계정은 비어 있다", async () => {
    const client = fakeClient({ user: null });

    const gate = await readAuthGate(client);

    expect(gate).toEqual({ destination: "/login", account: null });
  });

  it("세션은 있지만 승인 전이면 대기 화면으로 보낸다", async () => {
    const client = fakeClient({ user: fakeUser(), approvedAt: null });

    const gate = await readAuthGate(client);

    expect(gate.destination).toBe("/pending");
    expect(gate.account?.email).toBe("person@example.com");
  });

  it("승인 시각이 채워져 있으면 첫 화면으로 보낸다", async () => {
    const client = fakeClient({
      user: fakeUser(),
      approvedAt: "2026-01-01T00:00:00.000Z",
    });

    const gate = await readAuthGate(client);

    expect(gate.destination).toBe("/");
  });

  it("user_metadata에 avatar_url이 있으면 그 값을 계정 사진으로 쓴다", async () => {
    const client = fakeClient({
      user: fakeUser({ avatar_url: "https://example.com/avatar.png" }),
      approvedAt: null,
    });

    const gate = await readAuthGate(client);

    expect(gate.account?.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("avatar_url이 없고 picture만 있으면 picture 값을 계정 사진으로 쓴다", async () => {
    const client = fakeClient({
      user: fakeUser({ picture: "https://example.com/picture.png" }),
      approvedAt: null,
    });

    const gate = await readAuthGate(client);

    expect(gate.account?.avatarUrl).toBe("https://example.com/picture.png");
  });

  it("avatar_url도 picture도 없으면 계정 사진은 비어 있다", async () => {
    const client = fakeClient({ user: fakeUser(), approvedAt: null });

    const gate = await readAuthGate(client);

    expect(gate.account?.avatarUrl).toBeNull();
  });
});
