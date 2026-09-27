import type { Db } from "@/shared/api/database";

/**
 * 홀의 자리·근무 시간 기본값이다. 날을 여는 순간 이 값이 그 날에 깔린다
 * (`docs/2-design/modules/schedule/design.md`의 「홀 기본값」).
 *
 * **홀이 하나다.** 표에 행이 하나뿐이라 무엇을 고를지가 없고, 그래서 인자도 없다.
 *
 * **자리 하나가 한 줄로 온다.** 표는 「매니저 2」처럼 접어 두지만
 * (`supabase/migrations/20260922091501_halls.sql`) 화면은 자리를 하나씩 세고 하나씩
 * 지운다 — 접힌 것을 그대로 올리면 세는 자리마다 다시 편다. 펴는 손을 여기 하나만 둔다.
 *
 * `default_starts`·`default_ends`는 `time`이라 `"10:00:00"` 꼴로 온다 — 화면에 쓰는
 * `"10:00"`으로 자르는 것은 읽는 쪽 몫이다.
 */

export type HallSlot = {
  positions: string[];
  count: number;
};

export type HallDefaults = {
  default_slots: HallSlot[];
  default_starts: string;
  default_ends: string;
};

type StoredSlot = { positions?: unknown; count?: unknown };

/** 「같은 자리 n개」를 자리 n줄로 편다. 편 줄은 각각 하나짜리다. */
export function expandHallSlots(stored: unknown): HallSlot[] {
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.flatMap((entry: StoredSlot) => {
    const positions = Array.isArray(entry.positions)
      ? entry.positions.map(String)
      : [];
    const count = typeof entry.count === "number" ? entry.count : 1;

    return Array.from({ length: Math.max(0, count) }, () => ({
      positions,
      count: 1,
    }));
  });
}

export async function getHallDefaults(client: Db): Promise<HallDefaults> {
  const { data, error } = await client
    .from("halls")
    .select("default_slots, default_starts, default_ends")
    .single();

  if (error) {
    throw error;
  }

  return {
    default_slots: expandHallSlots(data.default_slots),
    default_starts: data.default_starts,
    default_ends: data.default_ends,
  };
}
