import { randomUUID } from "node:crypto";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

function expectSqlError(action: () => void, pattern: RegExp): void {
  let caught: unknown;
  try {
    action();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  const stderr = (
    caught as { stderr?: Buffer } | undefined
  )?.stderr?.toString();
  expect(stderr ?? "").toMatch(pattern);
}

const UNIQUE_VIOLATION = /violates unique constraint/;

function seedNotification(
  profileId: string,
  kind = "signup_approved",
  subjectId: string | null = randomUUID(),
): string {
  const id = randomUUID();
  const subjectSql = subjectId === null ? "null" : `'${subjectId}'`;
  execSql(
    `insert into public.notifications (id, profile_id, kind, subject_id, payload) values (:'id', :'profile_id', :'kind', ${subjectSql}, '{}'::jsonb);\n`,
    { id, profile_id: profileId, kind },
  );
  return id;
}

function seedPushToken(profileId: string, token: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.push_tokens (id, profile_id, token) values (:'id', :'profile_id', :'token');\n",
    { id, profile_id: profileId, token },
  );
  return id;
}

function rlsToken(): string {
  return `ExponentPushToken[test-rls-${randomUUID()}]`;
}

describe("알림 표 둘의 RLS", () => {
  let admin: AdminUser;
  let withDevice: ApprovedUser;
  let noDevice: ApprovedUser;

  let notificationId: string;
  let pushTokenId: string;
  let pushTokenValue: string;

  beforeAll(async () => {
    admin = await createAdminUser();
    withDevice = await createApprovedUser();
    noDevice = await createApprovedUser();

    notificationId = seedNotification(withDevice.profileId);
    pushTokenValue = rlsToken();
    pushTokenId = seedPushToken(withDevice.profileId, pushTokenValue);
  });

  describe("notifications는 본인 행만 읽는다(AC-01)", () => {
    it("본인은 자기 알림을 읽는다", async () => {
      const { data, error } = await withDevice.client
        .from("notifications")
        .select("id")
        .eq("id", notificationId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: notificationId }]);
    });

    it("남의 알림은 한 행도 못 읽는다", async () => {
      const { data, error } = await noDevice.client
        .from("notifications")
        .select("id")
        .eq("id", notificationId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe("push_tokens는 본인 행만 읽고 쓴다(AC-02)", () => {
    it("본인은 자기 기기 주소를 읽는다", async () => {
      const { data, error } = await withDevice.client
        .from("push_tokens")
        .select("id")
        .eq("id", pushTokenId);

      expect(error).toBeNull();
      expect(data).toEqual([{ id: pushTokenId }]);
    });

    it("남의 기기 주소는 한 행도 못 읽는다", async () => {
      const { data, error } = await noDevice.client
        .from("push_tokens")
        .select("id")
        .eq("id", pushTokenId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("남이 직접 update를 걸어도 값이 안 바뀐다", async () => {
      await noDevice.client
        .from("push_tokens")
        .update({ token: rlsToken() })
        .eq("id", pushTokenId);

      const { data } = await withDevice.client
        .from("push_tokens")
        .select("token")
        .eq("id", pushTokenId)
        .single<{ token: string }>();

      expect(data?.token).toBe(pushTokenValue);
    });

    it("남이 직접 delete를 걸어도 행이 남는다", async () => {
      await noDevice.client.from("push_tokens").delete().eq("id", pushTokenId);

      const { data } = await withDevice.client
        .from("push_tokens")
        .select("id")
        .eq("id", pushTokenId);

      expect(data).toEqual([{ id: pushTokenId }]);
    });

    it("같은 token을 두 번 저장하려 하면 unique 제약이 막는다", () => {
      const token = rlsToken();
      seedPushToken(withDevice.profileId, token);

      expectSqlError(
        () => seedPushToken(noDevice.profileId, token),
        UNIQUE_VIOLATION,
      );
    });
  });

  describe("push_reachable 뷰(AC-03)", () => {
    it("기기가 없는 사람도 행이 서고 has_device가 거짓이다", async () => {
      const { data, error } = await admin.client
        .from("push_reachable")
        .select("profile_id, has_device")
        .eq("profile_id", noDevice.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([
        { profile_id: noDevice.profileId, has_device: false },
      ]);
    });

    it("기기가 있는 사람은 has_device가 참이다", async () => {
      const { data, error } = await admin.client
        .from("push_reachable")
        .select("profile_id, has_device")
        .eq("profile_id", withDevice.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([
        { profile_id: withDevice.profileId, has_device: true },
      ]);
    });

    it("관리자가 아니면 예외가 아니라 0건이다", async () => {
      const { data, error } = await noDevice.client
        .from("push_reachable")
        .select("profile_id, has_device")
        .eq("profile_id", withDevice.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("승인 전인 사람이 읽어도 예외가 아니라 0건이다", async () => {
      const unapproved = await createSignedInUser();

      const { data, error } = await unapproved.client
        .from("push_reachable")
        .select("profile_id, has_device")
        .eq("profile_id", withDevice.profileId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("뷰가 token 열을 안 낸다 — 주소 원문이 안 샌다", async () => {
      const { error } = await admin.client
        .from("push_reachable")
        .select("token")
        .eq("profile_id", withDevice.profileId);

      expect(error).not.toBeNull();
    });
  });

  describe("notifications의 (profile_id, kind, subject_id) 부분 unique(AC-04)", () => {
    it("같은 (profile_id, kind, subject_id)를 두 번 넣으면 두 번째가 unique 위반이다", () => {
      const subjectId = randomUUID();
      seedNotification(withDevice.profileId, "shift_reminder", subjectId);

      expectSqlError(
        () =>
          seedNotification(withDevice.profileId, "shift_reminder", subjectId),
        UNIQUE_VIOLATION,
      );
    });

    it("subject_id가 널인 행은 같은 (profile_id, kind)로 여러 번 선다", () => {
      expect(() => {
        seedNotification(withDevice.profileId, "signup_approved", null);
        seedNotification(withDevice.profileId, "signup_approved", null);
      }).not.toThrow();
    });

    it("사람이 다르면 같은 (kind, subject_id)도 각각 선다", () => {
      const subjectId = randomUUID();

      expect(() => {
        seedNotification(withDevice.profileId, "shift_reminder", subjectId);
        seedNotification(noDevice.profileId, "shift_reminder", subjectId);
      }).not.toThrow();
    });
  });
});
