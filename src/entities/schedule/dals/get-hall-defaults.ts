import type { Db } from "@/shared/api/database";

/**
 * 홀의 자리·근무 시간 기본값이다. 날을 여는 순간 이 값이 그 날에 깔린다
 * (`docs/2-design/modules/schedule/design.md`의 「홀 기본값」).
 *
 * **홀이 하나다.** 표에 행이 하나뿐이라 무엇을 고를지가 없고, 그래서 인자도 없다.
 *
 * **자리는 접힌 꼴 그대로 온다.** 「매니저 2」는 두 줄이 아니라 `count: 2`인 한 줄이고
 * (`supabase/migrations/20260922091501_halls.sql`), `open_day`가 그 꼴을 읽어
 * `generate_series(1, count)`로 자리를 깐다. 여기서 펴면 표와 함수가 읽는 꼴이 갈린다 —
 * 자리를 하나씩 세야 하는 화면이 있으면 그 펴기는 그 화면 슬라이스의 순수 함수 몫이다.
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

export async function getHallDefaults(client: Db): Promise<HallDefaults> {
  const { data, error } = await client
    .from("halls")
    .select("default_slots, default_starts, default_ends")
    .single();

  if (error) {
    throw error;
  }

  return {
    default_slots: (data.default_slots ?? []) as HallSlot[],
    default_starts: data.default_starts,
    default_ends: data.default_ends,
  };
}
