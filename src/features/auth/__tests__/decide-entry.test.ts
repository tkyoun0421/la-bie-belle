import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthDestination } from "@/shared/lib/resolve-auth-destination";
import { decideEntry } from "@/features/auth/decide-entry";

const fakeClient = {} as SupabaseClient;
const fakeUser = { id: "user-1" } as User;

const DESTINATIONS: AuthDestination[] = [
  "/login",
  "/pending",
  "/blocked",
  "/left",
  "/",
];

describe("decideEntry — 세션을 읽고 목적지를 정하되 실패하면 /retry로 뭉갠다", () => {
  it.each(DESTINATIONS)(
    "세션 읽기가 성공하면 resolveEntryDestination의 결과 %s를 그대로 돌려준다",
    async (destination) => {
      const result = await decideEntry({
        client: fakeClient,
        getCurrentUser: async () => fakeUser,
        resolveEntryDestination: async () => destination,
      });

      expect(result).toBe(destination);
    },
  );

  it("세션 읽기가 던지면 /retry다", async () => {
    const result = await decideEntry({
      client: fakeClient,
      getCurrentUser: async () => {
        throw new Error("세션 읽기 실패");
      },
      resolveEntryDestination: async () => "/",
    });

    expect(result).toBe("/retry");
  });

  it("resolveEntryDestination이 던지면 /retry다", async () => {
    const result = await decideEntry({
      client: fakeClient,
      getCurrentUser: async () => fakeUser,
      resolveEntryDestination: async () => {
        throw new Error("목적지 판정 실패");
      },
    });

    expect(result).toBe("/retry");
  });

  it("Error가 아닌 값을 던져도 /retry다", async () => {
    const result = await decideEntry({
      client: fakeClient,
      getCurrentUser: async () => fakeUser,
      resolveEntryDestination: async () => {
        throw "문자열 실패";
      },
    });

    expect(result).toBe("/retry");
  });
});
