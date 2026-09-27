import type { Db } from "@/shared/api/database";
import {
  monthStart,
  nextMonthStart,
} from "@/entities/schedule/dals/get-month-schedule";

/**
 * 그 달 근무 신청을 신청자 이름과 함께 읽는다. 달력 칸의 신청 수, 날 상세의 근무 신청 줄,
 * 모아보기 화면이 이 한 질의를 나눠 쓴다
 * (`docs/3-build/plans/schedule-admin.md` AC-01).
 *
 * **오는 행 수는 세션이 가른다.** 관리자에게는 전원의 신청이 오고 근무자에게는 제 행만 온다 —
 * 좁히는 것은 이 함수가 아니라 `availabilities`의 RLS다. 화면이 역할을 보고 질의를 갈라 쓰면
 * 벽이 두 곳에 생긴다.
 *
 * `push_reachable`도 `profile_id`로 `profiles`를 가리켜 관계가 둘이다. FK 이름을 박아
 * 어느 쪽인지 못 박는다 — 배정의 이름 임베딩과 같은 손이다.
 */

export type AvailabilityRow = {
  profile_id: string;
  work_date: string;
  profiles: { display_name: string | null } | null;
};

const AVAILABILITY_COLUMNS = [
  "profile_id",
  "work_date",
  "profiles!availabilities_profile_id_fkey(display_name)",
].join(", ");

export async function getMonthAvailabilities(
  client: Db,
  month: string,
): Promise<AvailabilityRow[]> {
  const { data, error } = await client
    .from("availabilities")
    .select(AVAILABILITY_COLUMNS)
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .returns<AvailabilityRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
