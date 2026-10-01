import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/shared/lib/getCurrentUser";
import { resolveAdminGuard } from "@/shared/lib/resolveAdminGuard";
import { supabase } from "@/shared/lib/supabase";
import { getMyProfile } from "@/entities/profile/dals/getMyProfile";

/**
 * 관리자 층의 문지기다. `/admin` 아래는 전부 이 껍데기를 지난다 —
 * `docs/2-design/system/navigation.md`의 「경로」가 「근무자가 `/admin`을 열면 `/`로
 * 보낸다」고 정했고 판정은 `resolveAdminGuard`가 든다.
 *
 * **읽기가 끝나기 전에는 아무것도 안 그린다.** 프로필을 모르는 동안 관리자 화면을 그려두면
 * 아닌 사람에게 한 프레임 비치고, 반대로 그 동안 `/`로 보내면 관리자가 제 화면에서
 * 튕긴다. 딥링크로 바로 들어오는 자리라 둘 다 실제로 일어난다.
 */
export default function AdminLayout() {
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [read, setRead] = useState(false);

  useEffect(() => {
    let abandoned = false;

    void (async () => {
      const user = await getCurrentUser(supabase);
      const row = user ? await getMyProfile(supabase, user.id) : null;

      if (!abandoned) {
        setProfile(row);
        setRead(true);
      }
    })().catch(() => {
      if (!abandoned) {
        setRead(true);
      }
    });

    return () => {
      abandoned = true;
    };
  }, []);

  const move = resolveAdminGuard(profile);

  if (!read) {
    return null;
  }

  if (move) {
    return <Redirect href={move} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
