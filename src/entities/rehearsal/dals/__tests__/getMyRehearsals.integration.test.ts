import { randomUUID } from "node:crypto";
import { getMyRehearsals } from "@/entities/rehearsal/dals/getMyRehearsals";
import {
  createApprovedUser,
  execSql,
  kstMonthStart,
  type ApprovedUser,
} from "@tests/integration/postgres";

function freshMonth(): string {
  return kstMonthStart(24 + Math.floor(Math.random() * 90000));
}

function nextMonthOf(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const rolls = index === 12;
  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

function seedTimeRehearsal(
  profileId: string,
  workDate: string,
  startsAt: string,
  endsAt: string,
): string {
  const id = randomUUID();
  execSql(
    "insert into public.rehearsals (id, profile_id, work_date, starts_at, ends_at) values (:'id', :'profile_id', :'work_date', :'starts_at', :'ends_at');\n",
    {
      id,
      profile_id: profileId,
      work_date: workDate,
      starts_at: startsAt,
      ends_at: endsAt,
    },
  );
  return id;
}

function seedCountRehearsal(
  profileId: string,
  workDate: string,
  count: number,
): string {
  const id = randomUUID();
  execSql(
    `insert into public.rehearsals (id, profile_id, work_date, count) values (:'id', :'profile_id', :'work_date', ${count});\n`,
    { id, profile_id: profileId, work_date: workDate },
  );
  return id;
}

describe("getMyRehearsals dal(plan AC-05) — 본인 행을 그 달 범위로 읽는다", () => {
  let worker: ApprovedUser;

  beforeAll(async () => {
    worker = await createApprovedUser();
  });

  it("그 달 밖과 남의 행은 빠지고 본인의 그 달 행만 온다", async () => {
    const month = freshMonth();
    const other = await createApprovedUser();
    const inMonthId = seedTimeRehearsal(
      worker.profileId,
      month,
      "14:00",
      "16:00",
    );
    seedTimeRehearsal(worker.profileId, nextMonthOf(month), "14:00", "16:00");
    seedCountRehearsal(other.profileId, month, 2);

    const rows = await getMyRehearsals(worker.client, month);

    expect(rows.map((row) => row.id)).toEqual([inMonthId]);
  });

  it("시각 갈래와 건수 갈래가 각자의 열 값 그대로 온다", async () => {
    const month = freshMonth();
    const timeDate = `${month.slice(0, 7)}-01`;
    const countDate = `${month.slice(0, 7)}-02`;
    const timeId = seedTimeRehearsal(
      worker.profileId,
      timeDate,
      "09:00",
      "10:30",
    );
    const countId = seedCountRehearsal(worker.profileId, countDate, 3);

    const rows = await getMyRehearsals(worker.client, month);
    const timeRow = rows.find((row) => row.id === timeId);
    const countRow = rows.find((row) => row.id === countId);

    expect(timeRow?.work_date).toBe(timeDate);
    expect(timeRow?.starts_at).toMatch(/^09:00/);
    expect(timeRow?.ends_at).toMatch(/^10:30/);
    expect(timeRow?.count).toBeNull();

    expect(countRow?.work_date).toBe(countDate);
    expect(countRow?.count).toBe(3);
    expect(countRow?.starts_at).toBeNull();
    expect(countRow?.ends_at).toBeNull();
  });
});
