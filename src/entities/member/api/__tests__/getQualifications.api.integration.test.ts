import { getQualifications } from "@/entities/member/api/getQualifications.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
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

async function rpcOrThrow(
  user: RpcCaller,
  fn: string,
  args: Record<string, unknown>,
): Promise<void> {
  const { error } = await rpc(user, fn, args);
  if (error) {
    throw new Error(error.message);
  }
}

async function seedOpenDay(admin: AdminUser): Promise<{ dayId: string }> {
  return withFreshMonth(async (monthsFromNow) => {
    const workDate = kstMonthStart(monthsFromNow);
    await rpcOrThrow(admin, "create_schedule", {
      p_month: workDate,
      p_deadline: kstDate(1),
    });
    await rpcOrThrow(admin, "open_day", { p_work_date: workDate });

    const { data, error } = await admin.client
      .from("days")
      .select("id")
      .eq("work_date", workDate)
      .single<{ id: string }>();
    if (error || !data) {
      throw error ?? new Error("연 날을 못 찾았다");
    }
    return { dayId: data.id };
  });
}

function seedGrant(
  profileId: string,
  position: string,
  grantedBy: string,
): void {
  execSql(
    "insert into public.position_grants (profile_id, position, granted_by) values (:'profile_id', :'position', :'granted_by');\n",
    { profile_id: profileId, position, granted_by: grantedBy },
  );
}

describe("getQualifications dal — qualifications 뷰 전체를 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    await seedOpenDay(admin);
  });

  it("자격 부여 행이 (profile_id, position) 꼴로 온다", async () => {
    const grantee = await createApprovedUser();
    seedGrant(grantee.profileId, "팀장", admin.profileId);

    const rows = await getQualifications(admin.client);

    expect(rows).toContainEqual({
      profile_id: grantee.profileId,
      position: "팀장",
    });
  });
});
