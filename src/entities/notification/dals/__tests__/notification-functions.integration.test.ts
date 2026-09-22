import { randomUUID } from "node:crypto";
import {
  createApprovedUser,
  createBlockedUser,
  createLeftUser,
  execSql,
  type ApprovedUser,
  type BlockedUser,
  type LeftUser,
} from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

type Caller = { client: SignedInUser["client"] };

async function rpcOrThrow(
  caller: Caller,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await caller.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

function seedNotification(profileId: string, kind = "signup_approved"): string {
  const id = randomUUID();
  execSql(
    "insert into public.notifications (id, profile_id, kind, subject_id, payload) values (:'id', :'profile_id', :'kind', :'subject_id', '{}'::jsonb);\n",
    { id, profile_id: profileId, kind, subject_id: randomUUID() },
  );
  return id;
}

function seedReadNotification(
  profileId: string,
  readAt: string,
  kind = "signup_approved",
): string {
  const id = randomUUID();
  execSql(
    "insert into public.notifications (id, profile_id, kind, subject_id, payload, read_at) values (:'id', :'profile_id', :'kind', :'subject_id', '{}'::jsonb, :'read_at');\n",
    {
      id,
      profile_id: profileId,
      kind,
      subject_id: randomUUID(),
      read_at: readAt,
    },
  );
  return id;
}

function fnToken(): string {
  return `ExponentPushToken[test-fn-${randomUUID()}]`;
}

describe("알림 함수 넷", () => {
  let userA: ApprovedUser;
  let userB: ApprovedUser;

  beforeAll(async () => {
    userA = await createApprovedUser();
    userB = await createApprovedUser();
  });

  describe("mark_notifications_read(AC-04)", () => {
    it("남의 알림 id를 넣으면 조용히 아무 일도 안 하고 read_at이 널 그대로다", async () => {
      const notificationId = seedNotification(userA.profileId);

      const { error } = await userB.client.rpc("mark_notifications_read", {
        p_ids: [notificationId],
      });
      expect(error).toBeNull();

      const { data } = await userA.client
        .from("notifications")
        .select("read_at")
        .eq("id", notificationId)
        .single<{ read_at: string | null }>();
      expect(data?.read_at).toBeNull();
    });

    it("이미 읽은 알림은 다시 불러도 첫 시각이 남는다", async () => {
      const firstReadAt = "2020-01-01T00:00:00.000Z";
      const notificationId = seedReadNotification(userA.profileId, firstReadAt);

      const { error } = await userA.client.rpc("mark_notifications_read", {
        p_ids: [notificationId],
      });
      expect(error).toBeNull();

      const { data } = await userA.client
        .from("notifications")
        .select("read_at")
        .eq("id", notificationId)
        .single<{ read_at: string | null }>();
      expect(new Date(data!.read_at!).toISOString()).toBe(
        new Date(firstReadAt).toISOString(),
      );
    });

    it("한 개짜리 배열도 된다 — 안 읽은 알림이 읽음으로 찍힌다", async () => {
      const notificationId = seedNotification(userA.profileId);

      const { error } = await userA.client.rpc("mark_notifications_read", {
        p_ids: [notificationId],
      });
      expect(error).toBeNull();

      const { data } = await userA.client
        .from("notifications")
        .select("read_at")
        .eq("id", notificationId)
        .single<{ read_at: string | null }>();
      expect(data?.read_at).not.toBeNull();
    });
  });

  describe("save_push_token(AC-05)", () => {
    it("기기를 물려받으면 행의 profile_id가 새 주인으로 바뀌고 행이 하나다", async () => {
      const token = fnToken();

      await rpcOrThrow(userA, "save_push_token", { p_token: token });
      await rpcOrThrow(userB, "save_push_token", { p_token: token });

      const { data: bRows } = await userB.client
        .from("push_tokens")
        .select("profile_id")
        .eq("token", token);
      expect(bRows).toEqual([{ profile_id: userB.profileId }]);

      const { data: aRows } = await userA.client
        .from("push_tokens")
        .select("id")
        .eq("token", token);
      expect(aRows).toEqual([]);
    });

    it("의사가 거짓이면 저장이 조용히 아무 일도 안 한다", async () => {
      const fresh = await createApprovedUser();
      await rpcOrThrow(fresh, "set_notifications_enabled", { p_on: false });

      const { error } = await fresh.client.rpc("save_push_token", {
        p_token: fnToken(),
      });
      expect(error).toBeNull();

      const { data } = await fresh.client
        .from("push_tokens")
        .select("id")
        .eq("profile_id", fresh.profileId);
      expect(data).toEqual([]);
    });
  });

  describe("remove_push_token(AC-05)", () => {
    it("남의 주소를 넣어도 안 지워진다", async () => {
      const token = fnToken();
      await rpcOrThrow(userA, "save_push_token", { p_token: token });

      const { error } = await userB.client.rpc("remove_push_token", {
        p_token: token,
      });
      expect(error).toBeNull();

      const { data } = await userA.client
        .from("push_tokens")
        .select("token")
        .eq("token", token);
      expect(data).toEqual([{ token }]);
    });
  });

  describe("set_notifications_enabled(AC-06)", () => {
    it("새로 만든 사람은 notifications_enabled가 참으로 선다", async () => {
      const fresh = await createApprovedUser();

      const { data } = await fresh.client
        .from("profiles")
        .select("notifications_enabled")
        .eq("id", fresh.profileId)
        .single<{ notifications_enabled: boolean }>();
      expect(data?.notifications_enabled).toBe(true);
    });

    it("끄면 notifications_enabled가 거짓이 되고 push_tokens 행이 0이 된다", async () => {
      const fresh = await createApprovedUser();
      const token = fnToken();
      await rpcOrThrow(fresh, "save_push_token", { p_token: token });

      const { error } = await fresh.client.rpc("set_notifications_enabled", {
        p_on: false,
      });
      expect(error).toBeNull();

      const { data: profile } = await fresh.client
        .from("profiles")
        .select("notifications_enabled")
        .eq("id", fresh.profileId)
        .single<{ notifications_enabled: boolean }>();
      expect(profile?.notifications_enabled).toBe(false);

      const { data: tokens } = await fresh.client
        .from("push_tokens")
        .select("id")
        .eq("token", token);
      expect(tokens).toEqual([]);
    });

    it("켜면 의사만 바뀌고 기기 주소는 새로 안 생긴다", async () => {
      const fresh = await createApprovedUser();
      await rpcOrThrow(fresh, "set_notifications_enabled", { p_on: false });

      const { error } = await fresh.client.rpc("set_notifications_enabled", {
        p_on: true,
      });
      expect(error).toBeNull();

      const { data: profile } = await fresh.client
        .from("profiles")
        .select("notifications_enabled")
        .eq("id", fresh.profileId)
        .single<{ notifications_enabled: boolean }>();
      expect(profile?.notifications_enabled).toBe(true);

      const { data: tokens } = await fresh.client
        .from("push_tokens")
        .select("id")
        .eq("profile_id", fresh.profileId);
      expect(tokens).toEqual([]);
    });
  });

  describe("호출자 검사 — 함수 넷 모두(AC-07)", () => {
    let pending: SignedInUser;
    let blocked: BlockedUser;
    let left: LeftUser;

    beforeAll(async () => {
      pending = await createSignedInUser();
      blocked = await createBlockedUser();
      left = await createLeftUser();
    });

    describe("mark_notifications_read", () => {
      it("승인 대기 중인 사람이 불러도 성공한다", async () => {
        const { error } = await pending.client.rpc("mark_notifications_read", {
          p_ids: [],
        });
        expect(error).toBeNull();
      });

      it("차단된 사람이 부르면 not_allowed", async () => {
        const { error } = await blocked.client.rpc("mark_notifications_read", {
          p_ids: [],
        });
        expect(error?.message).toBe("not_allowed");
      });

      it("나간 사람이 부르면 not_allowed", async () => {
        const { error } = await left.client.rpc("mark_notifications_read", {
          p_ids: [],
        });
        expect(error?.message).toBe("not_allowed");
      });
    });

    describe("save_push_token", () => {
      it("승인 대기 중인 사람이 불러도 성공한다", async () => {
        const { error } = await pending.client.rpc("save_push_token", {
          p_token: fnToken(),
        });
        expect(error).toBeNull();
      });

      it("차단된 사람이 부르면 not_allowed", async () => {
        const { error } = await blocked.client.rpc("save_push_token", {
          p_token: fnToken(),
        });
        expect(error?.message).toBe("not_allowed");
      });

      it("나간 사람이 부르면 not_allowed", async () => {
        const { error } = await left.client.rpc("save_push_token", {
          p_token: fnToken(),
        });
        expect(error?.message).toBe("not_allowed");
      });
    });

    describe("remove_push_token", () => {
      it("승인 대기 중인 사람이 불러도 성공한다", async () => {
        const { error } = await pending.client.rpc("remove_push_token", {
          p_token: fnToken(),
        });
        expect(error).toBeNull();
      });

      it("차단된 사람이 부르면 not_allowed", async () => {
        const { error } = await blocked.client.rpc("remove_push_token", {
          p_token: fnToken(),
        });
        expect(error?.message).toBe("not_allowed");
      });

      it("나간 사람이 부르면 not_allowed", async () => {
        const { error } = await left.client.rpc("remove_push_token", {
          p_token: fnToken(),
        });
        expect(error?.message).toBe("not_allowed");
      });
    });

    describe("set_notifications_enabled", () => {
      it("승인 대기 중인 사람이 불러도 성공한다", async () => {
        const { error } = await pending.client.rpc(
          "set_notifications_enabled",
          { p_on: true },
        );
        expect(error).toBeNull();
      });

      it("차단된 사람이 부르면 not_allowed", async () => {
        const { error } = await blocked.client.rpc(
          "set_notifications_enabled",
          { p_on: true },
        );
        expect(error?.message).toBe("not_allowed");
      });

      it("나간 사람이 부르면 not_allowed", async () => {
        const { error } = await left.client.rpc("set_notifications_enabled", {
          p_on: true,
        });
        expect(error?.message).toBe("not_allowed");
      });
    });
  });
});
