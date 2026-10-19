export const RUN_ID_ENV = "INTEGRATION_RUN_ID";

export const STALE_RUN_AGE_MS = 6 * 60 * 60 * 1000;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const RUN_ID = "(\\d+)-[0-9a-f]{6}";

const NONCE = /^[0-9a-f]{6}$/;

const WHOLE_RUN_ID = new RegExp(`^${RUN_ID}$`);

const WHOLE_UUID = new RegExp(`^${UUID}$`);

const MARKED_EMAIL = new RegExp(`^test\\+(${RUN_ID})-${UUID}@example\\.test$`);

export const LEGACY_EMAIL_PATTERN = `^${UUID}@example\\.com$`;

const LEGACY_EMAIL = new RegExp(LEGACY_EMAIL_PATTERN);

export type TestUserRow = { id: string; email: string; createdAtMs: number };

export type PurgeBatch = { emailPattern: string; userIds: string[] };

export type OrphanProfileRow = {
  id: string;
  createdAtMs: number;
  approved: boolean;
  submitted: boolean;
  hasSubmittedEmail: boolean;
};

export function newRunId(startedAt: Date, nonce: string): string {
  if (!NONCE.test(nonce)) {
    throw new Error(`runId 의 nonce 는 여섯 자리 16진수다: "${nonce}"`);
  }

  return `${startedAt.getTime()}-${nonce}`;
}

function assertRunId(runId: string): void {
  if (!WHOLE_RUN_ID.test(runId)) {
    throw new Error(`runId 꼴이 아니다: "${runId}"`);
  }
}

export function testUserEmail(runId: string, userKey: string): string {
  assertRunId(runId);
  if (!WHOLE_UUID.test(userKey)) {
    throw new Error(`테스트 사용자 키는 uuid 다: "${userKey}"`);
  }

  return `test+${runId}-${userKey}@example.test`;
}

export function runEmailPattern(runId: string): string {
  assertRunId(runId);

  return `^test\\+${runId}-${UUID}@example\\.test$`;
}

export function runIdOf(email: string): string | null {
  return MARKED_EMAIL.exec(email)?.[1] ?? null;
}

function isStaleAt(now: Date, startedAtMs: number): boolean {
  return now.getTime() - startedAtMs > STALE_RUN_AGE_MS;
}

function runStartedAtMs(runId: string): number {
  return Number(runId.slice(0, runId.indexOf("-")));
}

export function stalePurgeBatches(
  users: readonly TestUserRow[],
  now: Date,
): PurgeBatch[] {
  const staleRuns = new Map<string, string[]>();
  const legacyIds: string[] = [];

  const isStale = (startedAtMs: number) => isStaleAt(now, startedAtMs);

  for (const user of users) {
    const runId = runIdOf(user.email);
    if (runId !== null) {
      if (isStale(runStartedAtMs(runId))) {
        staleRuns.set(runId, [...(staleRuns.get(runId) ?? []), user.id]);
      }
      continue;
    }
    if (LEGACY_EMAIL.test(user.email) && isStale(user.createdAtMs)) {
      legacyIds.push(user.id);
    }
  }

  const batches = [...staleRuns].map(([runId, userIds]) => ({
    emailPattern: runEmailPattern(runId),
    userIds,
  }));

  return legacyIds.length > 0
    ? [...batches, { emailPattern: LEGACY_EMAIL_PATTERN, userIds: legacyIds }]
    : batches;
}

function isApprovedWithoutSubmission(row: OrphanProfileRow): boolean {
  return row.approved && !row.submitted && !row.hasSubmittedEmail;
}

export function staleOrphanProfileIds(
  rows: readonly OrphanProfileRow[],
  now: Date,
): string[] {
  return rows
    .filter(
      (row) =>
        isApprovedWithoutSubmission(row) && isStaleAt(now, row.createdAtMs),
    )
    .map((row) => row.id);
}
