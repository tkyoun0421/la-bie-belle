import type { Database } from "@/shared/api/database";
import { getHallDefaults } from "@/entities/hall/api/getHallDefaults.api";
import type { HallSlot } from "@/entities/hall/model/hall.type";
import { createAdminUser, type AdminUser } from "@tests/integration/postgres";

const DEFAULT_SLOTS: HallSlot[] = [
  { positions: ["팀장"], count: 1 },
  { positions: ["스캔"], count: 1 },
  { positions: ["메인"], count: 1 },
  { positions: ["드레스"], count: 1 },
  { positions: ["축가"], count: 1 },
  { positions: ["매니저"], count: 2 },
  { positions: ["안내"], count: 2 },
  { positions: ["드레스실"], count: 1 },
  { positions: ["대기실"], count: 1 },
];
const DEFAULT_STARTS = "10:00";
const DEFAULT_ENDS = "22:00";

function withManagerCount(count: number): HallSlot[] {
  return DEFAULT_SLOTS.map((entry) =>
    entry.positions[0] === "매니저" ? { ...entry, count } : entry,
  );
}

type FunctionName = keyof Database["public"]["Functions"];

async function rpcOrThrow<Name extends FunctionName>(
  admin: AdminUser,
  fn: Name,
  args: Database["public"]["Functions"][Name]["Args"],
): Promise<void> {
  const { error } = await admin.client.rpc(fn, args);
  if (error) {
    throw error;
  }
}

function countByPosition(slots: HallSlot[], position: string): number {
  return slots
    .filter(
      (slot) => slot.positions.length === 1 && slot.positions[0] === position,
    )
    .reduce((sum, slot) => sum + slot.count, 0);
}

describe("getHallDefaults dal — 자리·근무 시간 기본값을 읽는다", () => {
  let admin: AdminUser;

  beforeAll(async () => {
    admin = await createAdminUser();
  });

  afterEach(async () => {
    await rpcOrThrow(admin, "set_hall_defaults", {
      p_slots: DEFAULT_SLOTS,
      p_starts: DEFAULT_STARTS,
      p_ends: DEFAULT_ENDS,
    });
  });

  it("set_hall_defaults로 넣은 값 그대로 읽힌다", async () => {
    await rpcOrThrow(admin, "set_hall_defaults", {
      p_slots: withManagerCount(3),
      p_starts: "09:00",
      p_ends: "23:00",
    });

    const defaults = await getHallDefaults(admin.client);

    expect(defaults.starts).toMatch(/^09:00/);
    expect(defaults.ends).toMatch(/^23:00/);
    expect(countByPosition(defaults.slots, "매니저")).toBe(3);
  });
});
