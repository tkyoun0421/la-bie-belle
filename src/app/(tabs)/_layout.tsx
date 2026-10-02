import { Tabs } from "expo-router";
import { CalendarDays, House, User, Wallet } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { useMyProfileQuery } from "@/entities/profile/services/useMyProfileQuery";
import { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";
import { useSavePushTokenMutation } from "@/features/pushSwitch/hooks/useSavePushTokenMutation";
import { PUSH_DEPS } from "@/features/pushSwitch/model/pushDeps";
import {
  getPushPermission,
  requestPushPermission,
} from "@/features/pushSwitch/model/pushPermission";

/**
 * 근무자 탭 넷이다 — 홈·근무표·급여·나(components.md의 「탭 바」).
 * 아이콘은 자리를 잡아둔 것이고 정본이 이름을 정하면 그때 맞춘다.
 * 지금 탭을 브랜드 색으로 안 칠한다 — 진하기로만 가른다.
 *
 * **퇴사한 사람에게는 탭 바가 없다.** 열린 경로가 `/left`와 `/payroll` 둘뿐이라
 * (`docs/2-design/system/navigation.md`의 「경로」) 탭을 남기면 눌러도 안 열리는 탭이 셋
 * 선다. 판정이 화면이 아니라 여기 있는 것은 탭 바가 이 껍데기의 것이라서다 — 급여 화면은
 * 두 껍데기에 같은 모습으로 들어간다.
 *
 * **매 진입에 기기 주소를 보내는 자리도 여기다**
 * (`docs/2-design/spec/notification-settings.md`의 AC-04). 이 껍데기는 세션이 있는 사람만
 * 지나고 앱이 떠 있는 동안 안 내려가서, 앱이 뜰 때 한 번과 앞으로 돌아올 때마다를 한 자리에서
 * 받는다. 뿌리 껍데기에 두면 로그인 전에도 부르게 되고, 화면 하나에 두면 그 탭을 안 연 사람의
 * 주소가 안 선다.
 *
 * **여기서는 안 묻는다.** 이미 허락된 기기의 주소만 받아 온다 — 묻는 것은 사람이 누를 때뿐이다
 * ([NTF-017](../../../../docs/2-design/modules/notification/README.md#ntf-017)).
 */
export default function TabsLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { data: profile } = useMyProfileQuery(supabase, userId);

  useSavePushTokenMutation(supabase, pushToken, AppState);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => setUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    void getPushPermission(PUSH_DEPS.getPermissionsAsync)
      .then((permission) =>
        permission === "granted" ? requestPushPermission(PUSH_DEPS) : null,
      )
      .then((asked) => {
        if (asked?.permission === "granted") {
          setPushToken(asked.token);
        }
      })
      .catch(() => {});
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
