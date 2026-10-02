import { Redirect, Stack } from "expo-router";
import { supabase } from "@/shared/api/supabase";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { resolveAdminGuard } from "@/entities/session/model/resolveAdminGuard.policy";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";

/**
 * 관리자 층의 문지기다. `/admin` 아래는 전부 이 껍데기를 지난다 —
 * `docs/2-design/system/navigation.md`의 「경로」가 「근무자가 `/admin`을 열면 `/`로
 * 보낸다」고 정했고 판정은 `resolveAdminGuard`가 든다.
 *
 * **읽기가 끝나기 전에는 아무것도 안 그린다.** 프로필을 모르는 동안 관리자 화면을 그려두면
 * 아닌 사람에게 한 프레임 비치고, 반대로 그 동안 `/`로 보내면 관리자가 제 화면에서
 * 튕긴다. 딥링크로 바로 들어오는 자리라 둘 다 실제로 일어난다.
 *
 * **세션이 없으면 프로필을 안 기다린다.** 그 질의는 누구인지 모르는 동안 아예 안 나가서
 * 끝날 일이 없다 — 로그인 자체가 없는 것은 역할을 모르는 것과 같게 보고 바로 보낸다.
 */
export default function AdminLayout() {
  const { data: user, isLoading: asking } = useSessionUserQuery(supabase);
  const userId = user?.id ?? null;

  const { data: profile, isLoading: reading } = useMyProfileRowQuery(
    supabase,
    userId,
  );

  const read = !asking && (userId === null || !reading);
  const move = resolveAdminGuard(profile ?? null);

  if (!read) {
    return null;
  }

  if (move) {
    return <Redirect href={move} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
