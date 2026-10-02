import { useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/shared/api/supabase";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { Illustration } from "@/shared/ui/Illustration";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import {
  LEFT_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/left/consts/left.const";

/**
 * 퇴사한 사람이 앱을 열면 대시보드 대신 서는 자리다. 볼 수 있는 것은 지난 급여와 자기 근무
 * 기록까지고([ACC-011]), 갈 곳이 급여 하나라 버튼 하나로 끝난다 — 탭 바가 없다.
 *
 * 상태 배지도 도는 문구도 알림 영역도 없다. 셋 다 바뀔 것을 기다리는 자리의 장치인데 여기는
 * 기다림이 없다. 퇴사 날짜도 안 적는다 — 그만둔 날은 본인이 알고, 화면에 박으면 이 자리가
 * 통보처럼 읽힌다.
 *
 * **controller가 없다.** 이 화면이 드는 업무 상태가 하나도 없다 — 세션의 사람은
 * `useSessionUserQuery`가, 로그아웃은 `useSignOutMutation`이 가진다. 남은 둘은 어디로
 * 가는지고 그것은 이동이라 여기 산다.
 *
 * 정본은 `docs/2-design/modules/account/screens/login.md`의 「퇴사한 뒤 짜임」이다.
 */
export function LeftScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useSessionUserQuery(supabase);
  const { signOut, isPending } = useSignOutMutation(supabase);

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="farewell" />
        <Text size="xl" weight="semibold" className="text-center">
          {LEFT_COPY.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {LEFT_COPY.body}
        </Text>
        <Button
          variant="primary"
          className="mt-8 self-stretch"
          onPress={() => router.push("/payroll")}
        >
          {LEFT_COPY.payroll}
        </Button>
      </View>

      <View>
        <Divider className="my-5" />
        <View className="flex-row items-center justify-center gap-3">
          <Avatar
            name={me?.email ?? ""}
            photoUrl={me?.googlePhotoUrl ?? null}
            size={24}
          />
          <Text size="sm" tone="subtle">
            {me?.email ?? ""}
          </Text>
        </View>
        <Button
          variant="ghost"
          className="mt-4"
          loading={isPending}
          onPress={() => signOut(() => router.replace("/login"))}
        >
          {LEFT_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
