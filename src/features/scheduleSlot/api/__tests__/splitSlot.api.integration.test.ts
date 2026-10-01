import { randomUUID } from "node:crypto";
import { DomainError } from "@/shared/api/errors";
import { splitSlot } from "@/features/schedule/api/splitSlot.api";
import {
  createAdminUser,
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

function insertMergedSlot(dayId: string, positions: string[]): string {
  const id = randomUUID();
  const literal = `{${positions.map((position) => `"${position}"`).join(",")}}`;
  execSql(
    `insert into public.slots (id, day_id, positions) values (:'id', :'day_id', '${literal}');\n`,
    { id, day_id: dayId },
  );
  return id;
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

describe("splitSlot dal — split_slot을 부르고 오류를 DomainError로 올린다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  it("합친 자리를 나누면 두 포지션 자리로 돌아간다", async () => {
    const { dayId } = await seedOpenDay(admin);
    const mergedSlotId = insertMergedSlot(dayId, ["축가", "매니저"]);

    await splitSlot(admin.client, mergedSlotId);

    const restored축가 = await slotIdForPosition(admin, dayId, "축가");
    expect(restored축가).toBeDefined();

    const { data } = await admin.client
      .from("slots")
      .select("id, positions")
      .eq("day_id", dayId)
      .is("ended_at", null);
    const stillMerged = ((data ?? []) as { positions: string[] }[]).some(
      (slot) => slot.positions.length === 2,
    );
    expect(stillMerged).toBe(false);
  });

  it("포지션이 하나뿐이면 not_merged", async () => {
    const { dayId } = await seedOpenDay(admin);
    const slotId = await slotIdForPosition(admin, dayId, "축가");

    const error = await captureDomainError(() =>
      splitSlot(admin.client, slotId),
    );

    expect(error.code).toBe("not_merged");
  });
});
