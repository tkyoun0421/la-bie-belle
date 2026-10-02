import type { User } from "@supabase/supabase-js";
import type { DB } from "@/shared/api/database";
import { getCurrentUser as readSessionUser } from "@/entities/session/api/getCurrentUser.api";
import type { AuthDestination } from "@/entities/session/model/resolveAuthDestination.policy";
import { resolveEntryDestination as resolveDestinationFromProfile } from "@/features/auth/lib/resolveEntryDestination.lib";

export type EntryDecision = AuthDestination | "/retry";

type DecideEntryDeps = {
  client: DB;
  getCurrentUser?: (client: DB) => Promise<User | null>;
  resolveEntryDestination?: (
    userId: string | null,
    deps: { client: DB },
  ) => Promise<AuthDestination>;
};

/**
 * 세션 읽기든 프로필 읽기든 던지면 목적지가 없다. 그때 어디로 보내는지는 업무
 * 규칙이라 껍데기가 아니라 여기가 쥔다([navigation.md]의 「앱을 열면」).
 * 층 다섯 중 하나를 못 고른 채로 껍데기를 빈 화면에 두지 않고 다시 시도할
 * 화면으로 보낸다([login.md]의 「읽기 실패 짜임」).
 *
 * **판정인데 `.policy.ts`가 아니다.** 세션을 읽어 와야 판정할 수 있어 통신을 부르고,
 * 던지는 것을 받아 내는 try가 알맹이의 절반이다 — 「`.policy.ts`에서 통신 금지」와 같이
 * 설 수 없다. 순수한 판정은 `resolveAuthDestination`이 쥐고 여기는 그 함수에 먹일
 * 사실을 모아 오는 손이다.
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
