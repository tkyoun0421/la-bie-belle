import { randomUUID } from "node:crypto";
import {
  type AdminUser,
  createAdminUser,
  createApprovedUser,
  execSql,
  queryColumn,
  seedNotificationRow,
  seedPushToken,
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

function expectNotAllowedViaExecSql(sql: string): void {
  let caught: unknown;
  try {
    execSql(sql);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  const stderr = (
    caught as { stderr?: Buffer } | undefined
  )?.stderr?.toString();
  expect(stderr ?? "").toMatch(/not_allowed/);
}

function minutesBefore(baseIso: string, minutes: number): string {
  const date = new Date(baseIso);
  date.setUTCMinutes(date.getUTCMinutes() - minutes);
  return date.toISOString();
}

type ClaimedRow = { id: string; addresses: string[] };

function claimNotifications(ids: string[] | null, pNow: string): ClaimedRow[] {
  const idsSql =
    ids === null
      ? "null::uuid[]"
      : `array[${ids.map((id) => `'${id}'`).join(",")}]::uuid[]`;
  const rows = queryColumn(
    "select id::text || '|' || coalesce(array_to_string(addresses, ','), '')\n" +
      `from internal.claim_notifications(${idsSql}, :'p_now'::timestamptz);\n`,
    { p_now: pNow },
  );
  return rows.map((row) => {
    const [id, addresses] = row.split("|");
    return { id, addresses: addresses.length > 0 ? addresses.split(",") : [] };
  });
}

function settlePush(
  pushed: { id: string; receiptId: string }[],
  deadTokens: string[],
): void {
  const pushedJson = JSON.stringify(
    pushed.map((row) => ({ id: row.id, receipt_id: row.receiptId })),
  );
  const tokensSql =
    deadTokens.length === 0
      ? "array[]::text[]"
      : `array[${deadTokens.map((token) => `'${token}'`).join(",")}]::text[]`;
  execSql(`select internal.settle_push(:'p_pushed'::jsonb, ${tokensSql});\n`, {
    p_pushed: pushedJson,
  });
}

function receiptsToScrape(pNow: string): string[] {
  return queryColumn(
    "select id::text from internal.receipts_to_scrape(:'p_now'::timestamptz);\n",
    { p_now: pNow },
  );
}

function clearReceipts(ids: string[], deadTokens: string[]): void {
  const idsSql = `array[${ids.map((id) => `'${id}'`).join(",")}]::uuid[]`;
  const tokensSql =
    deadTokens.length === 0
      ? "array[]::text[]"
      : `array[${deadTokens.map((token) => `'${token}'`).join(",")}]::text[]`;
  execSql(`select internal.clear_receipts(${idsSql}, ${tokensSql});\n`);
}

function pushTokenExists(token: string): boolean {
  const rows = queryColumn(
    "select count(*) from public.push_tokens where token = :'token';\n",
    { token },
  );
  return Number(rows[0] ?? "0") > 0;
}

const SEND_PUSH_URL_SECRET_NAME = "send_push_url";
const SEND_PUSH_SERVICE_KEY_SECRET_NAME = "send_push_service_role_key";

function createSendPushVaultSecrets(): void {
  execSql(
    "select vault.create_secret(:'url', :'url_name');\n" +
      "select vault.create_secret(:'key', :'key_name');\n",
    {
      url: "http://127.0.0.1:54321/functions/v1/send-push",
      url_name: SEND_PUSH_URL_SECRET_NAME,
      key: "local-only-fake-service-key",
      key_name: SEND_PUSH_SERVICE_KEY_SECRET_NAME,
    },
  );
}

function deleteSendPushVaultSecrets(): void {
  execSql(
    "delete from vault.secrets where name in (:'url_name', :'key_name');\n",
    {
      url_name: SEND_PUSH_URL_SECRET_NAME,
      key_name: SEND_PUSH_SERVICE_KEY_SECRET_NAME,
    },
  );
}

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

let trackedUserIds: string[] = [];
let trackedNotificationIds: string[] = [];
let trackedPushTokens: string[] = [];

function trackUser(userId: string): void {
  trackedUserIds.push(userId);
}

function trackNotification(id: string): void {
  trackedNotificationIds.push(id);
}

function trackPushToken(token: string): void {
  trackedPushTokens.push(token);
}

afterEach(() => {
  if (trackedNotificationIds.length > 0) {
    const idList = trackedNotificationIds.map((id) => `'${id}'`).join(",");
    execSql(
      `delete from public.notifications where id = any(array[${idList}]::uuid[]);\n`,
    );
    trackedNotificationIds = [];
  }
  if (trackedPushTokens.length > 0) {
    const tokenList = trackedPushTokens.map((token) => `'${token}'`).join(",");
    execSql(
      `delete from public.push_tokens where token = any(array[${tokenList}]::text[]);\n`,
    );
    trackedPushTokens = [];
  }
  if (trackedUserIds.length > 0) {
    const idList = trackedUserIds.map((id) => `'${id}'`).join(",");
    execSql(
      `delete from auth.users where id = any(array[${idList}]::uuid[]);\n`,
    );
    trackedUserIds = [];
  }
});

describe("internal.claim_notifications — 잡는 조건(plan AC-02)", () => {
  it("claimed_at이 1분 전이면 안 잡히고 3분 전이면 잡히며 push_attempts가 1 오른다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const insideId = seedNotificationRow({
      profileId: member.profileId,
      claimedAt: minutesBefore(pNow, 1),
    });
    trackNotification(insideId);
    const outsideId = seedNotificationRow({
      profileId: member.profileId,
      claimedAt: minutesBefore(pNow, 3),
    });
    trackNotification(outsideId);

    const claimed = claimNotifications([insideId, outsideId], pNow);

    expect(claimed.map((row) => row.id)).toEqual([outsideId]);
    const pushAttempts = queryColumn(
      "select push_attempts::text from public.notifications where id = :'id';\n",
      { id: outsideId },
    );
    expect(pushAttempts).toEqual(["1"]);
  });

  it("push_attempts가 5면 다시 안 잡힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const id = seedNotificationRow({
      profileId: member.profileId,
      pushAttempts: 5,
    });
    trackNotification(id);

    const claimed = claimNotifications([id], pNow);

    expect(claimed.map((row) => row.id)).not.toContain(id);
  });

  it("notifications_enabled가 거짓인 사람의 행은 안 잡힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    execSql(
      "update public.profiles set notifications_enabled = false where id = :'profile_id';\n",
      { profile_id: member.profileId },
    );
    const pNow = new Date().toISOString();
    const id = seedNotificationRow({ profileId: member.profileId });
    trackNotification(id);

    const claimed = claimNotifications([id], pNow);

    expect(claimed.map((row) => row.id)).not.toContain(id);
  });

  it("같은 사람의 행 둘이 각각 잡힌다 — 안 묶인다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const first = seedNotificationRow({
      profileId: member.profileId,
      kind: "shift_reminder",
    });
    trackNotification(first);
    const second = seedNotificationRow({
      profileId: member.profileId,
      kind: "before_shift",
    });
    trackNotification(second);

    const claimed = claimNotifications([first, second], pNow);

    expect(claimed.map((row) => row.id).sort()).toEqual([first, second].sort());
  });

  it("주소가 없는 사람의 행도 잡힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const id = seedNotificationRow({ profileId: member.profileId });
    trackNotification(id);

    const claimed = claimNotifications([id], pNow);

    const found = claimed.find((row) => row.id === id);
    expect(found).toBeDefined();
    expect(found?.addresses).toEqual([]);
  });

  it("주소가 둘인 사람의 행은 하나로 오고 주소 배열에 둘 다 든다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const tokenA = `ExponentPushToken[${randomUUID()}]`;
    const tokenB = `ExponentPushToken[${randomUUID()}]`;
    seedPushToken(member.profileId, tokenA);
    trackPushToken(tokenA);
    seedPushToken(member.profileId, tokenB);
    trackPushToken(tokenB);
    const pNow = new Date().toISOString();
    const id = seedNotificationRow({ profileId: member.profileId });
    trackNotification(id);

    const claimed = claimNotifications([id], pNow);

    expect(claimed.map((row) => row.id)).toEqual([id]);
    expect(claimed[0]?.addresses.slice().sort()).toEqual(
      [tokenA, tokenB].sort(),
    );
  });

  it("p_ids에 id 하나를 주면 조건에 맞는 다른 행이 있어도 그것만 잡힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const target = seedNotificationRow({ profileId: member.profileId });
    trackNotification(target);
    const other = seedNotificationRow({ profileId: member.profileId });
    trackNotification(other);

    const claimed = claimNotifications([target], pNow);

    expect(claimed.map((row) => row.id)).toEqual([target]);
    const otherPushAttempts = queryColumn(
      "select push_attempts::text from public.notifications where id = :'id';\n",
      { id: other },
    );
    expect(otherPushAttempts).toEqual(["0"]);
  });

  it("p_ids에 널을 주면 조건에 맞는 행이 잡힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const id = seedNotificationRow({ profileId: member.profileId });
    trackNotification(id);

    const claimed = claimNotifications(null, pNow);

    expect(claimed.map((row) => row.id)).toContain(id);
  });
});

describe("public.claim_notifications 호출자 검사(plan AC-02)", () => {
  it("로그인한 관리자 세션의 rpc('claim_notifications')가 거절된다", async () => {
    const admin = await createAdminUser();
    trackUser(admin.userId);

    const { error } = await rpc(admin, "claim_notifications", {
      p_ids: null,
    });

    expect(error?.message).toBe("not_allowed");
  });

  it("JWT가 아예 없는 호출도 거절된다 — is distinct from을 때리는 자리", () => {
    expectNotAllowedViaExecSql(
      "select public.claim_notifications(null::uuid[]);\n",
    );
  });
});

describe("internal.settle_push — 결과 쓰기(plan AC-03)", () => {
  it("넘긴 id의 pushed_at과 push_receipt_id가 찍힌다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const id = seedNotificationRow({
      profileId: member.profileId,
      claimedAt: new Date().toISOString(),
    });
    trackNotification(id);

    settlePush([{ id, receiptId: "receipt-abc" }], []);

    const rows = queryColumn(
      "select coalesce(pushed_at::text, '') || '|' || coalesce(push_receipt_id, '')\n" +
        "from public.notifications where id = :'id';\n",
      { id },
    );
    const [pushedAt, pushReceiptId] = (rows[0] ?? "|").split("|");
    expect(pushedAt).not.toBe("");
    expect(pushReceiptId).toBe("receipt-abc");
  });

  it("넘긴 주소의 push_tokens 행이 사라진다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const token = `ExponentPushToken[${randomUUID()}]`;
    seedPushToken(member.profileId, token);
    trackPushToken(token);

    settlePush([], [token]);

    expect(pushTokenExists(token)).toBe(false);
  });

  it("둘 다 빈 값이면 아무 일도 안 하고 끝난다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const id = seedNotificationRow({
      profileId: member.profileId,
      claimedAt: new Date().toISOString(),
    });
    trackNotification(id);
    const token = `ExponentPushToken[${randomUUID()}]`;
    seedPushToken(member.profileId, token);
    trackPushToken(token);

    expect(() => settlePush([], [])).not.toThrow();

    const rows = queryColumn(
      "select coalesce(pushed_at::text, '') || '|' || coalesce(push_receipt_id, '')\n" +
        "from public.notifications where id = :'id';\n",
      { id },
    );
    expect(rows).toEqual(["|"]);
    expect(pushTokenExists(token)).toBe(true);
  });
});

describe("public.settle_push 호출자 검사(plan AC-03)", () => {
  it("로그인한 관리자 세션의 rpc('settle_push')가 거절된다", async () => {
    const admin = await createAdminUser();
    trackUser(admin.userId);

    const { error } = await rpc(admin, "settle_push", {
      p_pushed: [],
      p_dead_tokens: [],
    });

    expect(error?.message).toBe("not_allowed");
  });

  it("JWT가 아예 없는 호출도 거절된다", () => {
    expectNotAllowedViaExecSql(
      "select public.settle_push('[]'::jsonb, array[]::text[]);\n",
    );
  });
});

describe("internal.receipts_to_scrape·clear_receipts — 긁기(plan AC-01·AC-04)", () => {
  it("push_receipt_id가 있고 pushed_at이 16분 전이면 대상이고 14분 전이면 아니다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const scrapeTarget = seedNotificationRow({
      profileId: member.profileId,
      pushedAt: minutesBefore(pNow, 16),
      pushReceiptId: `receipt-${randomUUID()}`,
    });
    trackNotification(scrapeTarget);
    const tooRecent = seedNotificationRow({
      profileId: member.profileId,
      pushedAt: minutesBefore(pNow, 14),
      pushReceiptId: `receipt-${randomUUID()}`,
    });
    trackNotification(tooRecent);

    const ids = receiptsToScrape(pNow);

    expect(ids).toContain(scrapeTarget);
    expect(ids).not.toContain(tooRecent);
  });

  it("clear_receipts 뒤에는 push_receipt_id가 널이라 대상에서 빠진다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    const pNow = new Date().toISOString();
    const id = seedNotificationRow({
      profileId: member.profileId,
      pushedAt: minutesBefore(pNow, 20),
      pushReceiptId: `receipt-${randomUUID()}`,
    });
    trackNotification(id);
    expect(receiptsToScrape(pNow)).toContain(id);

    clearReceipts([id], []);

    const pushReceiptIds = queryColumn(
      "select coalesce(push_receipt_id, '(null)') from public.notifications where id = :'id';\n",
      { id },
    );
    expect(pushReceiptIds).toEqual(["(null)"]);
    expect(receiptsToScrape(pNow)).not.toContain(id);
  });
});

describe("public.receipts_to_scrape 호출자 검사(plan AC-04)", () => {
  it("로그인한 관리자 세션의 rpc('receipts_to_scrape')가 거절된다", async () => {
    const admin = await createAdminUser();
    trackUser(admin.userId);

    const { error } = await rpc(admin, "receipts_to_scrape", {});

    expect(error?.message).toBe("not_allowed");
  });

  it("JWT가 아예 없는 호출도 거절된다", () => {
    expectNotAllowedViaExecSql("select public.receipts_to_scrape();\n");
  });
});

describe("public.clear_receipts 호출자 검사(plan AC-04)", () => {
  it("로그인한 관리자 세션의 rpc('clear_receipts')가 거절된다", async () => {
    const admin = await createAdminUser();
    trackUser(admin.userId);

    const { error } = await rpc(admin, "clear_receipts", {
      p_ids: [],
      p_dead_tokens: [],
    });

    expect(error?.message).toBe("not_allowed");
  });

  it("JWT가 아예 없는 호출도 거절된다", () => {
    expectNotAllowedViaExecSql(
      "select public.clear_receipts(array[]::uuid[], array[]::text[]);\n",
    );
  });
});

describe("두 경로 — 트리거와 cron(plan AC-08)", () => {
  it("notifications에 행 하나 넣으면 pg_net 호출이 1이다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    createSendPushVaultSecrets();

    try {
      const before = netRequestCursor();
      const id = seedNotificationRow({ profileId: member.profileId });
      trackNotification(id);

      expect(netRequestCountAfter(before)).toBe(1);
    } finally {
      deleteSendPushVaultSecrets();
    }
  });

  it("vault 항목이 없어 쏘기가 실패해도 그 insert가 안 죽고 행이 남는다", async () => {
    const member = await createApprovedUser();
    trackUser(member.userId);
    let id = "";

    expect(() => {
      id = seedNotificationRow({ profileId: member.profileId });
    }).not.toThrow();
    trackNotification(id);

    const rows = queryColumn(
      "select count(*) from public.notifications where id = :'id';\n",
      { id },
    );
    expect(rows).toEqual(["1"]);
  });

  it("cron.job에 retry-push 행이 하나고 schedule이 * * * * *다", () => {
    const jobNames = queryColumn(
      "select jobname from cron.job where jobname = 'retry-push';\n",
    );
    expect(jobNames).toEqual(["retry-push"]);

    const schedules = queryColumn(
      "select schedule from cron.job where jobname = 'retry-push';\n",
    );
    expect(schedules).toEqual(["* * * * *"]);
  });
});
