import { randomUUID } from "node:crypto";
import { getMyAvailability } from "@/entities/schedule/api/getMyAvailability.api";
import {
  createApprovedUser,
  execSql,
  kstMonthStart,
  type ApprovedUser,
} from "@tests/integration/postgres";

function randomOffset(): number {
  return 24 + Math.floor(Math.random() * 90000);
}

function nextMonthStart(monthDate: string): string {
  const [year, month] = monthDate.split("-").map(Number);
  const rolls = month === 12;
  const nextYear = rolls ? year + 1 : year;
  const nextMonth = rolls ? 1 : month + 1;

  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

function dayInMonth(monthDate: string, day: number): string {
  return `${monthDate.slice(0, 7)}-${String(day).padStart(2, "0")}`;
}

function seedAvailability(profileId: string, workDate: string): void {
  execSql(
    "insert into public.availabilities (id, profile_id, work_date) values (:'id', :'profile_id', :'work_date');\n",
    { id: randomUUID(), profile_id: profileId, work_date: workDate },
  );
}

describe("getMyAvailability — 본인 신청을 그 달 범위만 읽는다", () => {
  let owner: ApprovedUser;

  beforeAll(async () => {
    owner = await createApprovedUser();
  });

  it("그 달 안의 신청은 전부 온다", async () => {
    const monthDate = kstMonthStart(randomOffset());
    const month = monthDate.slice(0, 7);
    const day1 = dayInMonth(monthDate, 1);
    const day2 = dayInMonth(monthDate, 2);

    seedAvailability(owner.profileId, day1);
    seedAvailability(owner.profileId, day2);

    const dates = await getMyAvailability(owner.client, month);

    expect([...dates].sort()).toEqual([day1, day2]);
  });

  it("다른 달의 신청은 안 온다", async () => {
    const monthDate = kstMonthStart(randomOffset());
    const month = monthDate.slice(0, 7);
    const inMonth = dayInMonth(monthDate, 1);
    const outsideMonth = nextMonthStart(monthDate);

    seedAvailability(owner.profileId, inMonth);
    seedAvailability(owner.profileId, outsideMonth);

    const dates = await getMyAvailability(owner.client, month);

    expect(dates).toEqual([inMonth]);
  });
});
