import { readEventAssignments } from "#/entities/assignments/repositories/readAssignmentRepository";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export async function fetchEventAssignments(eventId: string) {
  const client = await createSupabaseServerClient();

  return readEventAssignments(eventId, { client });
}
