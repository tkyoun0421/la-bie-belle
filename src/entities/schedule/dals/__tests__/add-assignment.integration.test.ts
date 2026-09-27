import { DomainError } from "@/shared/api/errors";
import { addAssignment } from "@/entities/schedule/dals/add-assignment";
import {
  createAdminUser,
  createApprovedUser,
  kstDate,
  kstMonthStart,
  withFreshMonth,
  type AdminUser,
  type ApprovedUser,
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

async function seedOpenDay(
  admin: AdminUser,
): Promise<{ dayId: string; workDate: string }> {
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
    return { dayId: data.id, workDate };
  });
}

async function slotIdForPosition(
  admin: AdminUser,
  dayId: string,
  position: string,
): Promise<string> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id, positions")
    .eq("day_id", dayId)
    .is("ended_at", null);
  if (error) {
    throw error;
  }
  const found = ((data ?? []) as { id: string; positions: string[] }[]).find(
    (slot) => slot.positions.length === 1 && slot.positions[0] === position,
  );
  if (!found) {
    throw new Error(`${position} 자리를 못 찾았다`);
  }
  return found.id;
}

async function applyForDay(
  user: ApprovedUser,
  workDate: string,
): Promise<void> {
  const month = `${workDate.slice(0, 7)}-01`;
  await rpcOrThrow(user, "submit_availability", {
    p_month: month,
    p_dates: [workDate],
  });
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

describe("addAssignment dal — add_assignment을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("신청한 사람을 정규 자리에 배정하면 새 배정 id를 낸다", async () => {
    const { dayId, workDate } = await seedOpenDay(admin);
    const applicant = await createApprovedUser();
    await applyForDay(applicant, workDate);
    const slotId = await slotIdForPosition(admin, dayId, "안내");

    const assignmentId = await addAssignment(admin.client, {
      profileId: applicant.profileId,
      kind: "regular",
      slotId,
    });

    const { data } = await admin.client
      .from("assignments")
      .select("profile_id, slot_id, kind")
      .eq("id", assignmentId)
      .single<{ profile_id: string; slot_id: string | null; kind: string }>();
    expect(data?.profile_id).toBe(applicant.profileId);
    expect(data?.slot_id).toBe(slotId);
    expect(data?.kind).toBe("regular");
  });

  it("신청 안 한 사람에게 배정하면 not_applied", async () => {
    const { dayId } = await seedOpenDay(admin);
    const applicant = await createApprovedUser();
    const slotId = await slotIdForPosition(admin, dayId, "안내");

    const error = await captureDomainError(() =>
      addAssignment(admin.client, {
        profileId: applicant.profileId,
        kind: "regular",
        slotId,
      }),
    );

    expect(error.code).toBe("not_applied");
  });
});
