import { Tabs } from "expo-router";
import { CalendarDays, House, User, Wallet } from "lucide-react-native";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { PUSH_DEPS } from "@/features/pushSwitch/lib/pushDeps.lib";
import {
  getPushPermission,
  requestPushPermission,
} from "@/features/pushSwitch/lib/pushPermission.lib";
import { useSavePushTokenMutation } from "@/features/pushSwitch/services/useSavePushTokenMutation";

export default function TabsLayout() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { data: user } = useSessionUserQuery(supabase);
  const { data: profile } = useMyProfileRowQuery(supabase, user?.id ?? null);

  useSavePushTokenMutation(supabase, pushToken, AppState);

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
      tabBar={profile?.leftAt == null ? undefined : () => null}
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
