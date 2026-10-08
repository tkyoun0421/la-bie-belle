import type {
  NamedRehearsalRow,
  RehearsalRow,
} from "@/entities/rehearsal/api/rehearsal.dto";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";

export function toRehearsal(row: RehearsalRow): Rehearsal {
  return {
    id: row.id,
    profileId: row.profile_id,
    workDate: row.work_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    count: row.count,
    name: null,
  };
}

export function toNamedRehearsal(row: NamedRehearsalRow): Rehearsal {
  return { ...toRehearsal(row), name: row.profiles?.display_name ?? null };
}
