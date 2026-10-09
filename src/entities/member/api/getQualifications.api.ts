import type { DB } from "@/shared/api/database";
import type {
  FilledQualificationRow,
  QualificationRow,
} from "@/entities/member/api/member.dto";
import type { Qualification } from "@/entities/member/model/member.type";
import { toQualification } from "@/entities/member/utils/member.mapper";

function isFilled(row: QualificationRow): row is FilledQualificationRow {
  return row.profile_id !== null && row.position !== null;
}

export async function getQualifications(client: DB): Promise<Qualification[]> {
  const { data, error } = await client
    .from("qualifications")
    .select("profile_id, position")
    .returns<QualificationRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).filter(isFilled).map(toQualification);
}
