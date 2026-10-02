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
  RETRY_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/retry/consts/retry.const";
import { useRetryScreen } from "@/screens/retry/hooks/useRetryScreen";

/**
 * 로그인은 됐는데 앱이 뜨면서 프로필을 못 읽었을 때 서는 한 장이다. 어느 경로에서 실패했든
 * 여기다 — 게이트가 목적지를 못 정한 상태라 화면마다 다른 실패 모습을 그릴 수 없다.
 *
 * **조용히 재시도하지 않는다.** 앱이 뜨는 것처럼 보이는 빈 화면으로 몇 초를 쓰는 대신 바로
 * 말한다. 「다시 시도」는 판정을 통째로 다시 돌린다 — 성공하면 원래 가려던 자리가 그대로
 * 뜨고, 실패하면 이 화면이 그대로다. 몇 번째 실패인지 세지 않고 문구도 안 바꾼다.
 *
 * **controller가 하나 선다.** 게이트 셋 가운데 이 화면만 제 업무 상태를 든다 — 재시도가
 * 도는 중인지다. 세션의 사람과 로그아웃은 service 둘이 가지고 여기서 바로 부른다.
 *
 * 정본은 `docs/2-design/modules/account/screens/login.md`의 「읽기 실패 짜임」이다.
 */
export function RetryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: me } = useSessionUserQuery(supabase);
  const { signOut, isPending } = useSignOutMutation(supabase);
  const { retry, retrying } = useRetryScreen(supabase, router);

  return (
    <Screen
      floor="plain"
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-5"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="server-error" />
        <Text size="xl" weight="semibold" className="text-center">
          {RETRY_COPY.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {RETRY_COPY.body}
        </Text>
        <Button
          variant="primary"
          className="mt-8 self-stretch"
          loading={retrying}
          onPress={retry}
        >
          {RETRY_COPY.retry}
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
          {RETRY_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
