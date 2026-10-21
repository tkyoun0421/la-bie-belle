import { randomInt } from "node:crypto";
import { seed, setDefaultWageUnderLock } from "@scripts/e2eSeedServer.mts";
import {
  createAdminUser,
  DEFAULT_WAGE_RATES_LOCK,
  kstDate,
  queryColumn,
  withDbLock,
  withSharedDbLock,
  type AdminUser,
} from "@tests/integration/postgres";

type LockRunner = <T>(key: string, fn: () => Promise<T>) => Promise<T>;

const WAIT_LIMIT_MS = 2000;

const POLL_MS = 50;

const SEED_TIMEOUT_MS = 20_000;

function settle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitersOn(key: string): number {
  return Number(
    queryColumn(
      "select count(*) from pg_locks where locktype = 'advisory' and not granted and objid = (hashtext(:'key')::bigint & 4294967295)::oid;\n",
      { key },
    )[0] ?? "0",
  );
}

async function someoneWaitsOn(key: string): Promise<boolean> {
  for (let waited = 0; waited < WAIT_LIMIT_MS; waited += POLL_MS) {
    if (waitersOn(key) > 0) {
      return true;
    }
    await settle(POLL_MS);
  }

  return false;
}

function todayDefaultWage(): string | undefined {
  return queryColumn(
    "select amount from public.default_wage_rates where effective_date = :'today';\n",
    { today: kstDate() },
  )[0];
}

function freshAmount(): number {
  return 18000 + randomInt(1000);
}

const HOLDERS: [string, LockRunner][] = [
  ["배타 잠금", withDbLock],
  ["공유 잠금", withSharedDbLock],
];

describe("setDefaultWageUnderLock — 시드 서버의 기본 시급은 integration과 같은 잠금 뒤에 선다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it.each(HOLDERS)(
    "integration이 기본 시급 키를 %s으로 쥐고 있으면 풀릴 때까지 기다렸다가 쓴다",
    async (_mode, holdLock) => {
      const amount = freshAmount();
      let pending: Promise<void> = Promise.resolve();
      let waited = false;
      let wageWhileHeld: string | undefined;

      await holdLock(DEFAULT_WAGE_RATES_LOCK, async () => {
        pending = setDefaultWageUnderLock(admin, amount);
        waited = await someoneWaitsOn(DEFAULT_WAGE_RATES_LOCK);
        wageWhileHeld = todayDefaultWage();
      });
      await pending;

      expect(waited).toBe(true);
      expect(wageWhileHeld).not.toBe(String(amount));
      expect(todayDefaultWage()).toBe(String(amount));
    },
  );
});

describe("seed — 기본 시급을 바꾸는 시드 상태가 잠금 뒤에 선다", () => {
  it(
    "payroll_wages는 integration이 기본 시급 잠금을 쥐는 동안 기다린다",
    async () => {
      let pending: Promise<unknown> = Promise.resolve();
      let waited = false;

      await withDbLock(DEFAULT_WAGE_RATES_LOCK, async () => {
        pending = seed("payroll_wages");
        waited = await someoneWaitsOn(DEFAULT_WAGE_RATES_LOCK);
      });
      await pending;

      expect(waited).toBe(true);
    },
    SEED_TIMEOUT_MS,
  );
});
