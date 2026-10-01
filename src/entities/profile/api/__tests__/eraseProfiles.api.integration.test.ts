import { randomUUID } from "node:crypto";
import {
  type AdminUser,
  type ApprovedUser,
  backdateLeftAt,
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  queryColumn,
  seedAssignment,
  withFreshMonth,
} from "@tests/integration/postgres";

type RpcCaller = { client: AdminUser["client"] };

function rpc(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ error: { message: string } | null }> {
  return (
    user.client as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc(fn, args);
}

async function rpcOrThrow(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await rpc(user, fn, args);
  if (error) {
    throw new Error(error.message);
  }
}

const ERASE_ACCOUNT_URL_SECRET_NAME = "erase_account_url";
const ERASE_ACCOUNT_SERVICE_KEY_SECRET_NAME = "erase_account_service_role_key";

function createEraseAccountVaultSecrets(): void {
  execSql(
    "select vault.create_secret(:'url', :'url_name');\n" +
      "select vault.create_secret(:'key', :'key_name');\n",
    {
      url: "http://127.0.0.1:54321/functions/v1/erase-account",
      url_name: ERASE_ACCOUNT_URL_SECRET_NAME,
      key: "local-only-fake-service-key",
      key_name: ERASE_ACCOUNT_SERVICE_KEY_SECRET_NAME,
    },
  );
}

function deleteEraseAccountVaultSecrets(): void {
  execSql(
    "delete from vault.secrets where name in (:'url_name', :'key_name');\n",
    {
      url_name: ERASE_ACCOUNT_URL_SECRET_NAME,
      key_name: ERASE_ACCOUNT_SERVICE_KEY_SECRET_NAME,
    },
  );
}

function callEraseProfiles(pNow: string): void {
  execSql("select internal.erase_profiles(:'p_now'::timestamptz);\n", {
    p_now: pNow,
  });
}

function almostOneYearAgo(baseIso: string): string {
  const date = new Date(baseIso);
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function justOverOneYearAgo(baseIso: string): string {
  const date = new Date(baseIso);
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString();
}

function oneDayAgo(baseIso: string): string {
  const date = new Date(baseIso);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString();
}

function setErasedAt(profileId: string, erasedAtIso: string): void {
  execSql(
    "update public.profiles set erased_at = :'erased_at' where id = :'profile_id';\n",
    { profile_id: profileId, erased_at: erasedAtIso },
  );
}

function clearUserId(profileId: string): void {
  execSql(
    "update public.profiles set user_id = null where id = :'profile_id';\n",
    { profile_id: profileId },
  );
}

function seedProfilePrivate(profileId: string): void {
  execSql(
    "insert into public.profile_private (profile_id, phone, birth_date, gender)\n" +
      "values (:'profile_id', '010-0000-0001', '1990-01-01', 'female')\n" +
      "on conflict (profile_id) do nothing;\n",
    { profile_id: profileId },
  );
}

function seedNotification(profileId: string): void {
  execSql(
    "insert into public.notifications (id, profile_id, kind, payload)\n" +
      "values (:'id', :'profile_id', 'test_kind', '{}'::jsonb);\n",
    { id: randomUUID(), profile_id: profileId },
  );
}

function avatarObjectCount(userId: string): number {
  const rows = queryColumn(
    "select count(*) from storage.objects\n" +
      "where bucket_id = 'avatars' and (storage.foldername(name))[1] = :'user_id';\n",
    { user_id: userId },
  );
  return Number(rows[0] ?? "0");
}

async function uploadAvatar(user: ApprovedUser): Promise<void> {
  const path = `${user.userId}/${randomUUID()}.webp`;
  const { error } = await user.client.storage
    .from("avatars")
    .upload(path, Buffer.from("가짜 사진 데이터"), {
      contentType: "image/webp",
    });
  if (error) {
    throw error;
  }
}

// pg_net은 요청 행만 그 자리에서 넣고 응답 행은 백그라운드 워커가 나중에 쓴다.
// net._http_response를 부른 직후에 세면 아직 안 쓰인 것을 0으로 읽는다.
// 요청 번호를 내주는 시퀀스는 net.http_post가 동기로 당기니 그쪽을 센다.
function netRequestCursor(): number {
  const rows = queryColumn(
    "select case when is_called then last_value else 0 end\n" +
      "from net.http_request_queue_id_seq;\n",
  );
  return Number(rows[0] ?? "0");
}

function netRequestCountAfter(cursor: number): number {
  return netRequestCursor() - cursor;
}

type ProfileSnapshot = {
  display_name: string | null;
  photo_url: string | null;
  erased_at: string | null;
  left_at: string | null;
};

async function profileSnapshot(
  admin: AdminUser,
  profileId: string,
): Promise<ProfileSnapshot> {
  const { data, error } = await admin.client
    .from("profiles")
    .select("display_name, photo_url, erased_at, left_at")
    .eq("id", profileId)
    .single<ProfileSnapshot>();
  if (error || !data) {
    throw error ?? new Error("프로필을 못 찾았다");
  }
  return data;
}

async function profilePrivateExists(
  admin: AdminUser,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await admin.client
    .from("profile_private")
    .select("profile_id")
    .eq("profile_id", profileId);
  if (error) {
    throw error;
  }
  return (data ?? []).length > 0;
}

async function assignmentExists(
  admin: AdminUser,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await admin.client
    .from("assignments")
    .select("id")
    .eq("profile_id", profileId);
  if (error) {
    throw error;
  }
  return (data ?? []).length > 0;
}

async function wageRateExists(
  admin: AdminUser,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await admin.client
    .from("wage_rates")
    .select("profile_id")
    .eq("profile_id", profileId);
  if (error) {
    throw error;
  }
  return (data ?? []).length > 0;
}

async function positionGrantExists(
  admin: AdminUser,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await admin.client
    .from("position_grants")
    .select("id")
    .eq("profile_id", profileId);
  if (error) {
    throw error;
  }
  return (data ?? []).length > 0;
}

async function notificationCount(
  member: ApprovedUser,
  profileId: string,
): Promise<number> {
  const { data, error } = await member.client
    .from("notifications")
    .select("id")
    .eq("profile_id", profileId);
  if (error) {
    throw error;
  }
  return (data ?? []).length;
}

async function seedDayForAssignment(admin: AdminUser): Promise<string> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return data.id;
  });
}

let trackedUserIds: string[] = [];

function trackUser(userId: string): void {
  trackedUserIds.push(userId);
}

afterEach(() => {
  if (trackedUserIds.length === 0) {
    return;
  }
  const idList = trackedUserIds.map((id) => `'${id}'`).join(",");
  execSql(`delete from auth.users where id = any(array[${idList}]::uuid[]);\n`);
  trackedUserIds = [];
});

describe("internal.erase_profiles — 퇴사 1년 뒤 비우기(plan AC-01)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    createEraseAccountVaultSecrets();
  });

  afterAll(() => {
    deleteEraseAccountVaultSecrets();
  });

  it("퇴사한 지 1년이 채 안 됐으면 비워지지 않는다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    backdateLeftAt(member.userId, almostOneYearAgo(pNow));
    seedProfilePrivate(member.profileId);

    callEraseProfiles(pNow);

    const snapshot = await profileSnapshot(admin, member.profileId);
    expect(snapshot.erased_at).toBeNull();
    expect(await profilePrivateExists(admin, member.profileId)).toBe(true);
  });

  it("퇴사한 지 1년이 하루 지났으면 profile_private가 지워지고 photo_url이 널이 되고 erased_at이 찍힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    backdateLeftAt(member.userId, justOverOneYearAgo(pNow));
    seedProfilePrivate(member.profileId);
    await uploadAvatar(member);

    callEraseProfiles(pNow);

    const snapshot = await profileSnapshot(admin, member.profileId);
    expect(snapshot.erased_at).not.toBeNull();
    expect(snapshot.photo_url).toBeNull();
    expect(await profilePrivateExists(admin, member.profileId)).toBe(false);
  });

  it("display_name과 assignments·wage_rates·position_grants 행은 그대로 남는다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    await rpcOrThrow(admin, "set_display_name", {
      profile_id: member.profileId,
      display_name: "보존되는 이름",
    });
    await rpcOrThrow(admin, "set_wage", {
      p_profile_id: member.profileId,
      p_amount: 11000,
    });
    await rpcOrThrow(admin, "grant_position", {
      p_profile_id: member.profileId,
      p_position: "스캔",
    });
    const dayId = await seedDayForAssignment(admin);
    seedAssignment(dayId, member.profileId, "training");
    backdateLeftAt(member.userId, justOverOneYearAgo(pNow));

    callEraseProfiles(pNow);

    const snapshot = await profileSnapshot(admin, member.profileId);
    expect(snapshot.display_name).toBe("보존되는 이름");
    expect(await assignmentExists(admin, member.profileId)).toBe(true);
    expect(await wageRateExists(admin, member.profileId)).toBe(true);
    expect(await positionGrantExists(admin, member.profileId)).toBe(true);
  });

  it("left_at이 널이면 퇴사 안 한 행이라 한 건도 안 바뀐다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    seedProfilePrivate(member.profileId);

    callEraseProfiles(pNow);

    const snapshot = await profileSnapshot(admin, member.profileId);
    expect(snapshot.left_at).toBeNull();
    expect(snapshot.erased_at).toBeNull();
    expect(await profilePrivateExists(admin, member.profileId)).toBe(true);
  });

  it("두 번 불러도 첫 번째 erased_at이 그대로다 — 멱등", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const firstCallAt = new Date().toISOString();
    backdateLeftAt(member.userId, justOverOneYearAgo(firstCallAt));

    callEraseProfiles(firstCallAt);
    const firstSnapshot = await profileSnapshot(admin, member.profileId);
    expect(firstSnapshot.erased_at).not.toBeNull();

    const secondCallAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    callEraseProfiles(secondCallAt);
    const secondSnapshot = await profileSnapshot(admin, member.profileId);
    expect(secondSnapshot.erased_at).toBe(firstSnapshot.erased_at);
  });

  it("그 사람 경로의 사진 객체는 지워지고 남의 객체는 그대로다", async () => {
    const member = await createApprovedUser();
    const other = await createApprovedUser();
    trackUser(member.userId);
    trackUser(other.userId);
    const pNow = new Date().toISOString();
    await uploadAvatar(member);
    await uploadAvatar(other);
    backdateLeftAt(member.userId, justOverOneYearAgo(pNow));

    callEraseProfiles(pNow);

    expect(avatarObjectCount(member.userId)).toBe(0);
    expect(avatarObjectCount(other.userId)).toBe(1);
  });

  it("그 사람의 notifications 행은 그대로 남는다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    seedNotification(member.profileId);
    backdateLeftAt(member.userId, justOverOneYearAgo(pNow));

    callEraseProfiles(pNow);

    expect(await notificationCount(member, member.profileId)).toBe(1);
  });
});

describe("internal.erase_profiles — 쏘는 단계(plan AC-02)", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    createEraseAccountVaultSecrets();
  });

  afterAll(() => {
    deleteEraseAccountVaultSecrets();
  });

  it("erased_at은 있어도 user_id가 널이면 다시 쏘지 않는다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    setErasedAt(member.profileId, new Date().toISOString());
    clearUserId(member.profileId);
    const before = netRequestCursor();

    callEraseProfiles(new Date().toISOString());

    expect(netRequestCountAfter(before)).toBe(0);
  });

  it("erased_at이 옛 시각이고 user_id가 있으면 다시 한 번 쏜다 — 어제 못 지운 계정의 재시도", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    setErasedAt(member.profileId, oneDayAgo(new Date().toISOString()));
    const before = netRequestCursor();

    callEraseProfiles(new Date().toISOString());

    expect(netRequestCountAfter(before)).toBe(1);
  });

  it("vault 항목이 없어 쏘기가 실패해도 비운 것은 롤백되지 않는다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    backdateLeftAt(member.userId, justOverOneYearAgo(pNow));
    seedProfilePrivate(member.profileId);
    deleteEraseAccountVaultSecrets();

    try {
      expect(() => callEraseProfiles(pNow)).not.toThrow();

      const snapshot = await profileSnapshot(admin, member.profileId);
      expect(snapshot.erased_at).not.toBeNull();
    } finally {
      createEraseAccountVaultSecrets();
    }
  });
});

describe("cron 등록(plan AC-04) — 매일 한국 새벽 4시(UTC 19시)에 erase-profiles가 돈다", () => {
  it("cron.job에 erase-profiles 이름의 행이 하나고 스케줄이 0 19 * * *다", () => {
    const jobNames = queryColumn(
      "select jobname from cron.job where jobname = 'erase-profiles';\n",
    );
    expect(jobNames).toEqual(["erase-profiles"]);

    const schedules = queryColumn(
      "select schedule from cron.job where jobname = 'erase-profiles';\n",
    );
    expect(schedules).toEqual(["0 19 * * *"]);
  });
});

describe("internal 노출(plan AC-05) — PostgREST가 erase_profiles를 못 잡는다", () => {
  it("로그인한 클라이언트가 rpc('erase_profiles')를 불러도 못 잡는다", async () => {
    const admin = await createAdminUser();

    const { error } = await rpc(admin, "erase_profiles", {
      p_now: new Date().toISOString(),
    });

    expect(error).not.toBeNull();
  });
});
