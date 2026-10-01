import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { removeRehearsal } from "@/entities/rehearsal/dals/remove-rehearsal";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstMonthStart,
  type AdminUser,
} from "@tests/integration/postgres";

function freshWorkDate(): string {
  return kstMonthStart(24 + Math.floor(Math.random() * 90000));
}

/**
 * `remove_rehearsal`도 첫 줄에서 자격을 본다(plan AC-03) — 자격 없는 사람은 제 행이어도
 * `not_qualified`다. 지우는 길이 열리려면 자격이 있어야 해서 여기서 준다(implementer가 더한
 * 준비다).
 */
function grantRehearsal(profileId: string, grantedBy: string): void {
  execSql(
    "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', '리허설', :'granted_by');\n",
    { profile_id: profileId, granted_by: grantedBy },
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

async function captureDomainError(
  run: () => Promise<unknown>,
): Promise<DomainError> {
  try {
    await run();
  } catch (error) {
    if (error instanceof DomainError) {
      return error;
    }
    throw error;
  }
  throw new Error("에러가 나지 않았다");
}

describe("removeRehearsal dal(plan AC-05) — remove_rehearsal을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("본인이 지우면 행이 사라진다", async () => {
    const worker = await createApprovedUser();
    grantRehearsal(worker.profileId, admin.profileId);
    const workDate = freshWorkDate();
    const id = seedTimeRehearsal(worker.profileId, workDate, "14:00", "16:00");

    await removeRehearsal(worker.client, id);

    const { data } = await admin.client
      .from("rehearsals")
      .select("id")
      .eq("id", id);
    expect(data).toEqual([]);
  });

  it("남의 행을 지우면 DomainError(not_allowed)", async () => {
    const owner = await createApprovedUser();
    const other = await createApprovedUser();
    const workDate = freshWorkDate();
    const id = seedTimeRehearsal(owner.profileId, workDate, "14:00", "16:00");

    const error = await captureDomainError(() =>
      removeRehearsal(other.client, id),
    );

    expect(error.code).toBe("not_allowed");
  });
});
