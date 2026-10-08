import type { User } from "@supabase/supabase-js";
import type { DB } from "@/shared/api/database";
import { getCurrentUser as readSessionUser } from "@/entities/session/api/getCurrentUser.api";
import type { AuthDestination } from "@/entities/session/model/session.type";
import { resolveEntryDestination as resolveDestinationFromProfile } from "@/features/auth/lib/resolveEntryDestination.lib";
import type { EntryDecision } from "@/features/auth/model/auth.type";

type DecideEntryDeps = {
  client: DB;
  getCurrentUser?: (client: DB) => Promise<User | null>;
  resolveEntryDestination?: (
    userId: string | null,
    deps: { client: DB },
  ) => Promise<AuthDestination>;
};

export async function decideEntry({
  client,
  getCurrentUser = readSessionUser,
  resolveEntryDestination = resolveDestinationFromProfile,
}: DecideEntryDeps): Promise<EntryDecision> {
  try {
    const user = await getCurrentUser(client);

    return await resolveEntryDestination(user?.id ?? null, { client });
  } catch {
    return "/retry";
  }
}
