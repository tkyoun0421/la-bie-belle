import { randomUUID } from "node:crypto";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstMonthStart,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

function freshWorkDate(): string {
  return kstMonthStart(24 + Math.floor(Math.random() * 90000));
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

type RehearsalRow = { id: string };
type ErrorWithCode = { code?: string } | null;

type RehearsalsTable = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => Promise<{ data: RehearsalRow[] | null; error: unknown }>;
  };
  insert: (row: Record<string, unknown>) => Promise<{ error: ErrorWithCode }>;
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<{ error: ErrorWithCode }>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: ErrorWithCode }>;
  };
};

function rehearsalsTableFor(user: { client: unknown }): RehearsalsTable {
  return (
    user.client as unknown as { from: (table: string) => RehearsalsTable }
  ).from("rehearsals");
}

describe("rehearsals RLS(plan AC-02) — 본인 행과 관리자만 읽고, 직접 쓰기는 아무도 못 한다", () => {
  let admin: AdminUser;
  let owner: ApprovedUser;
  let reader: ApprovedUser;
  let rowId: string;
  let workDate: string;

  beforeAll(async () => {
    admin = await createAdminUser();
    owner = await createApprovedUser();
    reader = await createApprovedUser();
    workDate = freshWorkDate();
    rowId = seedTimeRehearsal(owner.profileId, workDate, "14:00", "16:00");
  });

  it("본인은 자기 리허설을 읽는다", async () => {
    const { data, error } = await rehearsalsTableFor(owner)
      .select("id")
      .eq("id", rowId);

    expect(error).toBeNull();
    expect(data).toEqual([{ id: rowId }]);
  });

  it("남의 리허설은 0행이다", async () => {
    const { data, error } = await rehearsalsTableFor(reader)
      .select("id")
      .eq("id", rowId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("관리자는 전원 리허설을 읽는다", async () => {
    const { data, error } = await rehearsalsTableFor(admin)
      .select("id")
      .eq("id", rowId);

    expect(error).toBeNull();
    expect(data).toEqual([{ id: rowId }]);
  });

  it("근무자가 직접 insert를 못 한다 — authenticated에서 권한을 거둔다", async () => {
    const { error } = await rehearsalsTableFor(reader).insert({
      profile_id: reader.profileId,
      work_date: workDate,
      starts_at: "10:00",
      ends_at: "11:00",
    });

    expect(error?.code).toBe("42501");
  });

  it("관리자도 직접 insert를 못 한다", async () => {
    const { error } = await rehearsalsTableFor(admin).insert({
      profile_id: admin.profileId,
      work_date: workDate,
      starts_at: "10:00",
      ends_at: "11:00",
    });

    expect(error?.code).toBe("42501");
  });

  it("본인도 직접 update를 못 한다", async () => {
    const { error } = await rehearsalsTableFor(owner)
      .update({ ends_at: "18:00" })
      .eq("id", rowId);

    expect(error?.code).toBe("42501");
  });

  it("본인도 직접 delete를 못 한다", async () => {
    const { error } = await rehearsalsTableFor(owner).delete().eq("id", rowId);

    expect(error?.code).toBe("42501");
  });
});
