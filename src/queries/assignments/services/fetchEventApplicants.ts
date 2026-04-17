import { readEventApplicants } from "#/entities/assignments/repositories/readAssignmentRepository";
import { createSupabaseServerClient } from "#/shared/lib/supabase/server";

export async function fetchEventApplicants(eventId: string) {
  const client = await createSupabaseServerClient();

  return readEventApplicants(eventId, { client });
}
