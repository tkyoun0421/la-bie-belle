import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { queryClient } from "@/shared/lib/query-client";
import { DEVICE_CLEANUP_NOT_WIRED_YET, signOut } from "@/shared/lib/sign-out";
import { supabase } from "@/shared/lib/supabase";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { Illustration } from "@/shared/ui/Illustration";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { googlePhotoOf } from "@/features/auth/google-photo-of";

/**
 * 차단된 사람이 앱을 열면 서는 자리다. 구글 로그인은 되지만 아무 행도 안 온다([ACC-007]).
 * 퇴사한 뒤와 같은 틀에서 「급여 보기」만 뺀 것이다 — primary 자리에 세울 것이 없어서
 * 로그아웃이 ghost 그대로 아래 덩이에 선다.
 *
 * 왜 막혔는지는 안 적는다. 관리자가 정한 것이고 앱이 대신 말할 것이 없다. 계정 한 줄이 어느
 * 구글 계정이 막힌 것인지만 보여준다 — 다른 계정으로 잘못 들어온 사람이 그것을 보고
 * 로그아웃한다.
 *
 * 정본은 `docs/2-design/modules/account/screens/login.md`의 「차단된 뒤 짜임」이다.
 */

const SCREEN_BOTTOM_PADDING = 24;

export function BlockedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let abandoned = false;

    void getCurrentUser(supabase).then((user) => {
      if (abandoned || !user) {
        return;
      }

      setEmail(user.email ?? "");
      setPhotoUrl(googlePhotoOf(user.user_metadata));
    });

    return () => {
      abandoned = true;
    };
  }, []);

  const onSignOut = useCallback(() => {
    void signOut({
      ...DEVICE_CLEANUP_NOT_WIRED_YET,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      clearQueryClient: () => queryClient.clear(),
    }).then(() => router.replace("/login"));
  }, [router]);

  return (
    <Screen
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="px-6"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="blocked" />
        <Text size="xl" weight="semibold" className="text-center">
          이 계정은 지금 이용할 수 없어요
        </Text>
        <Text size="sm" tone="muted" className="mt-2 text-center">
          궁금한 점은 관리자에게 물어보세요
        </Text>
      </View>

      <View>
        <Divider className="my-5" />
        <View className="flex-row items-center justify-center gap-3">
          <Avatar name={email} photoUrl={photoUrl} size={24} />
          <Text size="sm" tone="subtle">
            {email}
          </Text>
        </View>
        <Button variant="ghost" className="mt-4" onPress={onSignOut}>
          로그아웃
        </Button>
      </View>
    </Screen>
  );
}
