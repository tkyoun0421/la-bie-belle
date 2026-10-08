import type { Database } from "@/shared/api/database";
import { setHallDefaults } from "@/features/hallDefaults/api/setHallDefaults.api";
import { createAdminUser, type AdminUser } from "@tests/integration/postgres";

type SlotDefault = { positions: string[]; count: number };

const DEFAULT_SLOTS: SlotDefault[] = [
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

function withManagerCount(count: number): SlotDefault[] {
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

function countByPosition(
  slots: { positions: string[]; count: number }[],
  position: string,
): number {
  return slots
    .filter(
      (slot) => slot.positions.length === 1 && slot.positions[0] === position,
    )
    .reduce((sum, slot) => sum + slot.count, 0);
}

describe("setHallDefaults dal — set_hall_defaults를 부르고 halls 기본값을 바꾼다", () => {
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

  it("관리자가 부르면 halls의 자리·근무 시간 기본값이 바뀐다", async () => {
    await setHallDefaults(admin.client, {
      slots: withManagerCount(3),
      starts: "09:00",
      ends: "23:00",
    });

    const { data, error } = await admin.client
      .from("halls")
      .select("default_slots, default_starts, default_ends")
      .single<{
        default_slots: SlotDefault[];
        default_starts: string;
        default_ends: string;
      }>();
    expect(error).toBeNull();
    expect(data?.default_starts).toMatch(/^09:00/);
    expect(data?.default_ends).toMatch(/^23:00/);
    expect(countByPosition(data?.default_slots ?? [], "매니저")).toBe(3);
  });
});
