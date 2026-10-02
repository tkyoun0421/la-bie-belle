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
  BLOCKED_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/blocked/consts/blocked.const";

/**
 * 차단된 사람이 앱을 열면 서는 자리다. 구글 로그인은 되지만 아무 행도 안 온다([ACC-007]).
 * 퇴사한 뒤와 같은 틀에서 「급여 보기」만 뺀 것이다 — primary 자리에 세울 것이 없어서
 * 로그아웃이 ghost 그대로 아래 덩이에 선다.
 *
 * 왜 막혔는지는 안 적는다. 관리자가 정한 것이고 앱이 대신 말할 것이 없다. 계정 한 줄이 어느
 * 구글 계정이 막힌 것인지만 보여준다 — 다른 계정으로 잘못 들어온 사람이 그것을 보고
 * 로그아웃한다.
 *
 * **controller가 없다.** 이 화면이 드는 업무 상태가 하나도 없다 — 세션의 사람은
 * `useSessionUserQuery`가, 로그아웃은 `useSignOutMutation`이 가진다. 남은 것은 끝난 뒤
 * 어디로 가는지 하나고 그것은 이동이라 여기 산다.
 *
 * 정본은 `docs/2-design/modules/account/screens/login.md`의 「차단된 뒤 짜임」이다.
 */
export function BlockedScreen() {
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
        <Illustration scene="blocked" />
        <Text size="xl" weight="semibold" className="text-center">
          {BLOCKED_COPY.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          {BLOCKED_COPY.body}
        </Text>
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
          {BLOCKED_COPY.signOut}
        </Button>
      </View>
    </Screen>
  );
}
