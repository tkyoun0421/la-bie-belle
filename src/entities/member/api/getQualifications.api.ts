import type { DB } from "@/shared/api/database";
import type { Qualification } from "@/entities/member/api/member.dto";

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
