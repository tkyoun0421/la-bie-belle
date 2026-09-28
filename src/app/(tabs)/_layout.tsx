import { Tabs } from "expo-router";
import { CalendarDays, House, User, Wallet } from "lucide-react-native";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { supabase } from "@/shared/lib/supabase";
import { useMyProfile } from "@/features/profile/model/useMyProfile";

/**
 * 근무자 탭 넷이다 — 홈·근무표·급여·나(components.md의 「탭 바」).
 * 아이콘은 자리를 잡아둔 것이고 정본이 이름을 정하면 그때 맞춘다.
 * 지금 탭을 브랜드 색으로 안 칠한다 — 진하기로만 가른다.
 *
 * **퇴사한 사람에게는 탭 바가 없다.** 열린 경로가 `/left`와 `/payroll` 둘뿐이라
 * (`docs/2-design/system/navigation.md`의 「경로」) 탭을 남기면 눌러도 안 열리는 탭이 셋
 * 선다. 판정이 화면이 아니라 여기 있는 것은 탭 바가 이 껍데기의 것이라서다 — 급여 화면은
 * 두 껍데기에 같은 모습으로 들어간다.
 */
export default function TabsLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const { data: profile } = useMyProfile(supabase, userId);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => setUserId(user?.id ?? null));
  }, []);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={profile?.left_at == null ? undefined : () => null}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "근무표",
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: "급여",
          tabBarIcon: ({ color }) => <Wallet color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "나",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
