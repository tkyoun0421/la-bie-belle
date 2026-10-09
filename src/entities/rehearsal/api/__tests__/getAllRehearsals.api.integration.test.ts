import { randomUUID } from "node:crypto";
import { getAllRehearsals } from "@/entities/rehearsal/api/getAllRehearsals.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstMonthStart,
  type AdminUser,
} from "@tests/integration/postgres";

function freshMonth(): string {
  return kstMonthStart(24 + Math.floor(Math.random() * 90000));
}

function nameProfile(profileId: string, displayName: string): void {
  execSql(
    "update public.profiles set display_name = :'display_name' where id = :'profile_id';\n",
    { profile_id: profileId, display_name: displayName },
  );
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

describe("getAllRehearsals dal(plan AC-05) — 그 달 전원 행을 이름과 함께 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자가 부르면 전원의 행이 오고 profiles(display_name)이 임베딩된다", async () => {
    const month = freshMonth();
    const worker = await createApprovedUser();
    nameProfile(worker.profileId, "박서연");
    const id = seedTimeRehearsal(worker.profileId, month, "14:00", "16:00");

    const rows = await getAllRehearsals(admin.client, month);
    const row = rows.find((candidate) => candidate.id === id);

    expect(row?.profileId).toBe(worker.profileId);
    expect(row?.name).not.toBeNull();
  });

  it("관리자가 아니면 RLS가 좁혀 자기 행만 온다", async () => {
    const month = freshMonth();
    const worker = await createApprovedUser();
    const other = await createApprovedUser();
    const ownId = seedTimeRehearsal(worker.profileId, month, "09:00", "10:00");
    seedTimeRehearsal(other.profileId, month, "14:00", "16:00");

    const rows = await getAllRehearsals(worker.client, month);

    expect(rows.map((row) => row.id)).toEqual([ownId]);
  });
});
