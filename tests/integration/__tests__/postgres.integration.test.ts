import { randomUUID } from "node:crypto";
import {
  daysInMonth,
  monthWindow,
  yearWindow,
} from "@tests/integration/freshSlot";
import {
  createAdminUser,
  createApprovedUser,
  createLeftUser,
  createRejectedUser,
  execSql,
  freshMonth,
  freshYear,
  kstMonthStart,
  queryColumn,
  seedDayEndedHoursAgo,
  withDbLock,
  withFreshMonth,
  withSharedDbLock,
} from "@tests/integration/postgres";

function rowsBetween(
  table: string,
  column: string,
  window: { from: string; to: string },
): number {
  return Number(
    queryColumn(
      `select count(*) from public.${table} where ${column} >= :'from' and ${column} < :'to';\n`,
      window,
    )[0] ?? "0",
  );
}

function submittedAtOf(profileId: string): string {
  return (
    queryColumn(
      "select coalesce(submitted_at::text, '') from public.profiles where id = :'id';\n",
      { id: profileId },
    )[0] ?? ""
  );
}

function dayIdsOn(workDate: string): string[] {
  return queryColumn(
    "select id from public.days where work_date = :'work_date';\n",
    { work_date: workDate },
  );
}

type LockRunner = <T>(key: string, fn: () => Promise<T>) => Promise<T>;

const HOLD_MS = 1500;

function settle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startHolding(
  lock: LockRunner,
  key: string,
): Promise<{ isHolding: () => boolean; done: Promise<void> }> {
  let holding = false;
  let markHeld: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    markHeld = resolve;
  });

  const done = lock(key, async () => {
    holding = true;
    markHeld();
    await settle(HOLD_MS);
    holding = false;
  });

  await held;
  return { isHolding: () => holding, done };
}

async function heldTogether(
  first: LockRunner,
  second: LockRunner,
): Promise<boolean> {
  const key = `lock_probe_${randomUUID()}`;
  const holder = await startHolding(first, key);
  const overlapped = await second(key, async () => holder.isHolding());
  await holder.done;
  return overlapped;
}

describe("freshMonth — 고른 달이 비었는지 세어 보고 돌려준다", () => {
  it("기본은 schedules.month가 그 달에 없는 달이다", () => {
    const offset = freshMonth();

    expect(
      rowsBetween(
        "schedules",
        "month",
        monthWindow(kstMonthStart(offset), false),
      ),
    ).toBe(0);
  });

  it("neighbours면 앞뒤 달까지 근무표가 없다", () => {
    const offset = freshMonth({ neighbours: true });

    expect(
      rowsBetween(
        "schedules",
        "month",
        monthWindow(kstMonthStart(offset), true),
      ),
    ).toBe(0);
  });

  it("days를 주면 그 날 수의 달만 고른다", () => {
    const offset = freshMonth({ days: 31 });

    expect(daysInMonth(kstMonthStart(offset))).toBe(31);
  });

  it("표와 열을 주면 그 표의 날짜 열이 그 달에 빈 달이다", () => {
    const offset = freshMonth({ table: "holidays", column: "holiday_date" });

    expect(
      rowsBetween(
        "holidays",
        "holiday_date",
        monthWindow(kstMonthStart(offset), false),
      ),
    ).toBe(0);
  });

  it("withFreshMonth가 넘기는 달도 앞뒤 달까지 비었다", async () => {
    const offset = await withFreshMonth(
      async (monthsFromNow) => monthsFromNow,
      {
        neighbours: true,
      },
    );

    expect(
      rowsBetween(
        "schedules",
        "month",
        monthWindow(kstMonthStart(offset), true),
      ),
    ).toBe(0);
  });
});

describe("freshYear — 그 표의 날짜 열이 그 해에 빈 연도를 돌려준다", () => {
  it("holidays.holiday_date가 그 해에 하나도 없다", () => {
    const year = freshYear("holidays", "holiday_date");

    expect(rowsBetween("holidays", "holiday_date", yearWindow(year))).toBe(0);
  });
});

describe("결정이 난 사람을 만드는 헬퍼는 제출을 거친 사람을 만든다", () => {
  it("createApprovedUser가 만든 사람은 submitted_at이 차 있다", async () => {
    const approved = await createApprovedUser();

    expect(submittedAtOf(approved.profileId)).not.toBe("");
  });

  it("createLeftUser가 만든 사람은 submitted_at이 차 있다", async () => {
    const left = await createLeftUser();

    expect(submittedAtOf(left.profileId)).not.toBe("");
  });

  it("createRejectedUser가 만든 사람은 submitted_at이 차 있다", async () => {
    const rejected = await createRejectedUser();

    expect(submittedAtOf(rejected.profileId)).not.toBe("");
  });
});

describe("seedDayEndedHoursAgo — 그날 행은 이 회차가 연 것만 지운다", () => {
  it("같은 회차의 다른 관리자가 연 그날 행은 갈아 끼운다", async () => {
    const owner = await createAdminUser();
    const other = await createAdminUser();
    const first = await seedDayEndedHoursAgo(owner, 300);

    const second = await seedDayEndedHoursAgo(other, 300);

    expect(second.workDate).toBe(first.workDate);
    expect(dayIdsOn(second.workDate)).toEqual([second.dayId]);
  });

  it("이 회차 사용자가 아닌 사람이 연 그날 행은 지우지 않는다", async () => {
    const admin = await createAdminUser();
    const foreign = await seedDayEndedHoursAgo(admin, 400);
    const [outsiderId] = queryColumn(
      "insert into public.profiles (display_name) values ('바깥 사람') returning id;\n",
    );
    execSql(
      "update public.days set opened_by = :'outsider' where id = :'id';\n",
      {
        outsider: outsiderId,
        id: foreign.dayId,
      },
    );

    try {
      await expect(seedDayEndedHoursAgo(admin, 400)).rejects.toThrow();

      expect(dayIdsOn(foreign.workDate)).toEqual([foreign.dayId]);
    } finally {
      execSql(
        "delete from public.days where id = :'id';\ndelete from public.profiles where id = :'outsider';\n",
        { id: foreign.dayId, outsider: outsiderId },
      );
    }
  });
});

describe("withSharedDbLock — 같은 키의 공유 잠금끼리는 같이 서고 배타 잠금과는 엇갈린다", () => {
  it("공유 잠금 둘은 서로를 기다리지 않는다", async () => {
    expect(await heldTogether(withSharedDbLock, withSharedDbLock)).toBe(true);
  });

  it("배타 잠금은 공유 잠금이 풀린 뒤에 선다", async () => {
    expect(await heldTogether(withSharedDbLock, withDbLock)).toBe(false);
  });

  it("공유 잠금은 배타 잠금이 풀린 뒤에 선다", async () => {
    expect(await heldTogether(withDbLock, withSharedDbLock)).toBe(false);
  });
});
