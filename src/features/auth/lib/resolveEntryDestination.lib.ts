import type { DB } from "@/shared/api/database";
import { ensureProfile as ensureProfileDal } from "@/entities/profile/api/ensureProfile.api";
import { getMyProfile as getMyProfileDal } from "@/entities/profile/api/getMyProfile.api";
import type { Profile } from "@/entities/profile/model/profile.type";
import { resolveAuthDestination } from "@/entities/session/model/resolveAuthDestination.policy";
import type { AuthDestination } from "@/entities/session/model/session.type";

type EntryDeps = {
  client: DB;
  ensureProfile?: (client: DB) => Promise<void>;
  getMyProfile?: (client: DB, userId: string) => Promise<Profile | null>;
};

export async function resolveEntryDestination(
  userId: string | null,
  {
    client,
    ensureProfile = ensureProfileDal,
    getMyProfile = getMyProfileDal,
  }: EntryDeps,
): Promise<AuthDestination> {
  if (!userId) {
    return resolveAuthDestination({ hasSession: false, profile: null });
  }

  await ensureProfile(client);
  const profile = await getMyProfile(client, userId);

  return resolveAuthDestination({ hasSession: true, profile });
}
