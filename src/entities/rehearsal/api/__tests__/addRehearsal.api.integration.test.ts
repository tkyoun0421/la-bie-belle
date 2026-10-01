import { DomainError } from "@/shared/api/errors";
import { addRehearsal } from "@/entities/rehearsal/api/addRehearsal.api";
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

function grantRehearsal(profileId: string, grantedBy: string): void {
  execSql(
    "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', '리허설', :'granted_by');\n",
    { profile_id: profileId, granted_by: grantedBy },
  );
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

describe("addRehearsal dal(plan AC-05) — add_rehearsal을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("자격 있는 근무자가 배정 없는 날에 시각으로 넣으면 새 행이 선다", async () => {
    const worker = await createApprovedUser();
    grantRehearsal(worker.profileId, admin.profileId);
    const workDate = freshWorkDate();

    await addRehearsal(worker.client, {
      workDate,
      startsAt: "14:00",
      endsAt: "16:00",
    });

    const { data } = await admin.client
      .from("rehearsals")
      .select("profile_id, work_date, starts_at, ends_at, count")
      .eq("profile_id", worker.profileId)
      .eq("work_date", workDate)
      .single<{
        profile_id: string;
        work_date: string;
        starts_at: string;
        ends_at: string;
        count: number | null;
      }>();

    expect(data?.starts_at).toMatch(/^14:00/);
    expect(data?.ends_at).toMatch(/^16:00/);
    expect(data?.count).toBeNull();
  });

  it("리허설 자격이 없으면 DomainError(not_qualified)", async () => {
    const worker = await createApprovedUser();
    const workDate = freshWorkDate();

    const error = await captureDomainError(() =>
      addRehearsal(worker.client, {
        workDate,
        startsAt: "14:00",
        endsAt: "16:00",
      }),
    );

    expect(error.code).toBe("not_qualified");
  });
});
