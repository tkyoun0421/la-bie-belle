import { getSlotRequests } from "@/entities/schedule/api/getSlotRequests.api";
import {
  createAdminUser,
  createApprovedUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedRequestCandidate,
  seedWorkRequest,
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

async function seedOpenDay(
  admin: AdminUser,
): Promise<{ dayId: string; workDate: string; month: string }> {
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
    return { dayId: data.id, workDate, month: workDate.slice(0, 7) };
  });
}

type SlotRow = { id: string; positions: string[] };

async function slotsForDay(
  admin: AdminUser,
  dayId: string,
): Promise<SlotRow[]> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id, positions")
    .eq("day_id", dayId)
    .is("ended_at", null);
  if (error) {
    throw error;
  }
  return (data ?? []) as SlotRow[];
}

async function slotIdForPosition(
  admin: AdminUser,
  dayId: string,
  position: string,
  index = 0,
): Promise<string> {
  const slots = await slotsForDay(admin, dayId);
  const matches = slots.filter(
    (slot) => slot.positions.length === 1 && slot.positions[0] === position,
  );
  const found = matches[index];
  if (!found) {
    throw new Error(`${position} 자리를 못 찾았다`);
  }
  return found.id;
}

type SlotRequestRow = {
  id: string;
  closed_at: string | null;
  request_candidates: { profile_id: string; status: string }[];
};

describe("getSlotRequests dal — 그 달 살아 있는 근무 요청을 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("관리자는 그 달 살아 있는 요청 전부를 읽고 닫힌 요청은 안 든다", async () => {
    const { dayId, month } = await seedOpenDay(admin);
    const slotA = await slotIdForPosition(admin, dayId, "안내", 0);
    const slotB = await slotIdForPosition(admin, dayId, "안내", 1);
    const slotClosed = await slotIdForPosition(admin, dayId, "매니저", 0);

    const requestA = seedWorkRequest(slotA, admin.profileId);
    const candidateA = await createApprovedUser();
    seedRequestCandidate(requestA, candidateA.profileId, "pending");

    const requestB = seedWorkRequest(slotB, admin.profileId);
    const candidateB = await createApprovedUser();
    seedRequestCandidate(requestB, candidateB.profileId, "pending");

    const closedRequest = seedWorkRequest(slotClosed, admin.profileId);
    execSql(
      "update public.requests set closed_at = now() where id = :'id';\n",
      { id: closedRequest },
    );

    const requests = (await getSlotRequests(
      admin.client,
      month,
    )) as unknown as SlotRequestRow[];
    const ids = requests.map((row) => row.id);

    expect(ids).toEqual(expect.arrayContaining([requestA, requestB]));
    expect(ids).not.toContain(closedRequest);
  });

  it("근무자는 자기 갈래가 든 요청만 읽는다", async () => {
    const { dayId, month } = await seedOpenDay(admin);
    const slotMine = await slotIdForPosition(admin, dayId, "안내", 0);
    const slotOthers = await slotIdForPosition(admin, dayId, "안내", 1);

    const observer = await createApprovedUser();
    const stranger = await createApprovedUser();

    const myRequest = seedWorkRequest(slotMine, admin.profileId);
    seedRequestCandidate(myRequest, observer.profileId, "pending");

    const othersRequest = seedWorkRequest(slotOthers, admin.profileId);
    seedRequestCandidate(othersRequest, stranger.profileId, "pending");

    const requests = (await getSlotRequests(
      observer.client,
      month,
    )) as unknown as SlotRequestRow[];
    const ids = requests.map((row) => row.id);

    expect(ids).toContain(myRequest);
    expect(ids).not.toContain(othersRequest);
  });

  it("RLS — 근무자가 남이 후보인 요청을 requests 테이블에서 직접 읽으면 빈 결과다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotOthers = await slotIdForPosition(admin, dayId, "매니저", 0);

    const observer = await createApprovedUser();
    const stranger = await createApprovedUser();

    const othersRequest = seedWorkRequest(slotOthers, admin.profileId);
    seedRequestCandidate(othersRequest, stranger.profileId, "pending");

    const { data, error } = await observer.client
      .from("requests")
      .select("id")
      .eq("id", othersRequest);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
