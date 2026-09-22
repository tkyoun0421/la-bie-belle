import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveAuthDestination,
  type AuthDestination,
} from "@/shared/lib/resolve-auth-destination";
import { ensureProfile as ensureProfileDal } from "@/entities/profile/dals/ensure-profile";
import {
  getMyProfile as getMyProfileDal,
  type MyProfileRow,
} from "@/entities/profile/dals/get-my-profile";

type EntryDeps = {
  client: SupabaseClient;
  ensureProfile?: (client: SupabaseClient) => Promise<void>;
  getMyProfile?: (
    client: SupabaseClient,
    userId: string,
  ) => Promise<MyProfileRow | null>;
};

/**
 * 첫 진입이면 읽을 행이 아직 없다. ensure_profile을 먼저 불러 제 행을 만들어 두고
 * 그다음에 읽어야 「프로필 없음」과 「방금 들어온 사람」이 같은 답으로 모인다.
 */
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
  const row = await getMyProfile(client, userId);

  return resolveAuthDestination({
    hasSession: true,
    profile: row && {
      approvedAt: row.approved_at,
      blockedAt: row.blocked_at,
      leftAt: row.left_at,
    },
  });
}
