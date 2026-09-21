import { Tabs } from "expo-router";
import { CalendarDays, House, User, Wallet } from "lucide-react-native";

/**
 * 근무자 탭 넷이다 — 홈·근무표·급여·나(components.md의 「탭 바」).
 * 아이콘은 자리를 잡아둔 것이고 정본이 이름을 정하면 그때 맞춘다.
 * 지금 탭을 브랜드 색으로 안 칠한다 — 진하기로만 가른다.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
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
