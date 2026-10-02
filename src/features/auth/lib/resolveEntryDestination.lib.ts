import type { DB } from "@/shared/api/database";
import { ensureProfile as ensureProfileDal } from "@/entities/profile/api/ensureProfile.api";
import { getMyProfile as getMyProfileDal } from "@/entities/profile/api/getMyProfile.api";
import type { MyProfileRow } from "@/entities/profile/api/profile.dto";
import { resolveAuthDestination } from "@/entities/session/model/resolveAuthDestination.policy";
import type { AuthDestination } from "@/entities/session/model/session.type";

type EntryDeps = {
  client: DB;
  ensureProfile?: (client: DB) => Promise<void>;
  getMyProfile?: (client: DB, userId: string) => Promise<MyProfileRow | null>;
};

/**
 * 첫 진입이면 읽을 행이 아직 없다. ensure_profile을 먼저 불러 제 행을 만들어 두고
 * 그다음에 읽어야 「프로필 없음」과 「방금 들어온 사람」이 같은 답으로 모인다.
 *
 * 그 「먼저 불러」가 쓰기라 이 함수는 순수하지 않다. 목적지를 정하는 판정은
 * `resolveAuthDestination`이 쥐고 여기는 행을 세우고 읽어 그 판정에 먹인다.
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
