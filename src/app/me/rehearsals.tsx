import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { useQualificationsQuery } from "@/entities/member/hooks/useQualificationsQuery";
import { useMyProfileQuery } from "@/entities/profile/hooks/useMyProfileQuery";
import { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";
import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";
import { resolveRehearsalGuard } from "@/screens/rehearsal/model/rehearsalGuard.policy";
import { RehearsalScreen } from "@/screens/rehearsal/ui/RehearsalScreen";

/**
 * 리허설 화면의 문지기이자 라우트다. `/admin` 밖의 유일한 조건부 경로라
 * (`docs/2-design/system/navigation.md`의 「경로」) 자격이 있는 사람과 관리자만 열고 다른
 * 사람이 주소를 직접 치면 「나」로 보낸다. 판정은 `resolveRehearsalGuard`가 든다.
 *
 * **문을 화면이 아니라 여기가 지킨다.** 자격 판정에 「나」 슬라이스의 손이 필요한데
 * 슬라이스끼리는 서로를 못 부른다(규칙 3) — 둘을 조립하는 자리가 위 층인 여기다.
 * `/admin`의 문지기(`src/app/admin/_layout.tsx`)와 같은 꼴이다.
 *
 * **읽기가 끝나기 전에는 아무것도 안 그린다.** 자격을 모르는 동안 화면을 그려두면 아닌
 * 사람에게 한 프레임 비치고, 반대로 그 동안 보내면 자격 있는 사람이 제 화면에서 튕긴다.
 */

type RehearsalParams = {
  month?: string;
};

export default function Screen() {
  const { month } = useLocalSearchParams<RehearsalParams>();
  const [userId, setUserId] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);

  const { data: profile, isLoading: profileLoading } = useMyProfileQuery(
    supabase,
    userId,
  );
  const { data: grants, isLoading: grantsLoading } =
    useQualificationsQuery(supabase);

  useEffect(() => {
    void getCurrentUser(supabase)
      .then((user) => setUserId(user?.id ?? null))
      .finally(() => setAsked(true));
  }, []);

  const standing = resolveRehearsalGuard({
    isAdmin: profile?.role === "admin",
    hasGrant: hasRehearsalGrant(grants ?? [], profile?.id ?? null),
    // 로그인 자체가 없으면 기다릴 것이 없다 — 프로필을 모르는 것과 관리자가 아닌 것을
    // 같게 본다(`resolveAdminGuard`와 같은 결이다).
    isLoading: !asked || (userId !== null && (profileLoading || grantsLoading)),
  });

  if (standing === "wait") {
    return null;
  }

  if (standing === "redirect-me") {
    return <Redirect href="/me" />;
  }

  return <RehearsalScreen month={month} />;
}
