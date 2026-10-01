import type { DB } from "@/shared/api/database";

/**
 * 자격 전체다. 「자격 부여 ∪ 살아 있는 교육 배정」을 TS가 다시 합치지 않는다 — 판정은
 * `qualifications` 뷰가 끝냈고(`docs/2-design/modules/schedule/design.md`의 「자격」)
 * `add_assignment`도 같은 뷰를 본다. 같은 규칙이 SQL과 TS에 두 벌 서지 않는 것이 요점이다.
 *
 * 전원 것을 한 번에 읽는다. 픽커가 목록 전체의 자격을 동시에 갈라야 해서 사람마다 묻는
 * 모양이 안 맞는다.
 *
 * 뷰의 열이 nullable로 생성되는 것은 뷰라서지 값이 빈다는 뜻이 아니다 — 부르는 쪽이 둘 다
 * 쥐게 여기서 좁혀 낸다.
 */

export type Qualification = {
  profile_id: string;
  position: string;
};

type QualificationRow = {
  profile_id: string | null;
  position: string | null;
};

function isFilled(row: QualificationRow): boolean {
  return row.profile_id !== null && row.position !== null;
}

export async function getQualifications(client: DB): Promise<Qualification[]> {
  const { data, error } = await client
    .from("qualifications")
    .select("profile_id, position");

  if (error) {
    throw error;
  }

  return (data ?? []).filter(isFilled) as Qualification[];
}
