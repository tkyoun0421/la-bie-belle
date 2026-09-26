import { signOut } from "../sign-out";

describe("signOut — 로그아웃 뒤 기기 정리 순서를 지킨다", () => {
  it("remove_push_token → auth.signOut → queryClient.clear → 영속본 삭제 순서로 부른다", async () => {
    const calls: string[] = [];

    await signOut({
      removePushToken: async () => {
        calls.push("removePushToken");
      },
      signOut: async () => {
        calls.push("signOut");
      },
      clearQueryClient: () => {
        calls.push("clearQueryClient");
      },
      clearPersistedState: async () => {
        calls.push("clearPersistedState");
      },
    });

    expect(calls).toEqual([
      "removePushToken",
      "signOut",
      "clearQueryClient",
      "clearPersistedState",
    ]);
  });

  it("removePushToken이 끝나기 전에는 auth.signOut을 부르지 않는다", async () => {
    let removePushTokenResolved = false;
    let signOutCalledBeforeResolve = false;

    await signOut({
      removePushToken: () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            removePushTokenResolved = true;
            resolve();
          }, 10);
        }),
      signOut: async () => {
        if (!removePushTokenResolved) {
          signOutCalledBeforeResolve = true;
        }
      },
      clearQueryClient: () => {},
      clearPersistedState: async () => {},
    });

    expect(signOutCalledBeforeResolve).toBe(false);
  });
});
