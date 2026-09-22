import type { User } from "@supabase/supabase-js";
import type { Db } from "@/shared/api/database";
import { getCurrentUser as readSessionUser } from "@/shared/lib/get-current-user";
import type { AuthDestination } from "@/shared/lib/resolve-auth-destination";
import { resolveEntryDestination as resolveDestinationFromProfile } from "@/features/auth/resolve-entry-destination";

export type EntryDecision = AuthDestination | "/retry";

type DecideEntryDeps = {
  client: Db;
  getCurrentUser?: (client: Db) => Promise<User | null>;
  resolveEntryDestination?: (
    userId: string | null,
    deps: { client: Db },
  ) => Promise<AuthDestination>;
};

/**
 * 세션 읽기든 프로필 읽기든 던지면 목적지가 없다. 그때 어디로 보내는지는 업무
 * 규칙이라 껍데기가 아니라 여기가 쥔다([navigation.md]의 「앱을 열면」).
 * 층 다섯 중 하나를 못 고른 채로 껍데기를 빈 화면에 두지 않고 다시 시도할
 * 화면으로 보낸다([login.md]의 「읽기 실패 짜임」).
 */
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
