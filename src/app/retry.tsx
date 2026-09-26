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
import { Illustration } from "@/shared/ui/Illustration";
import { Text } from "@/shared/ui/Text";
import { decideEntry } from "@/features/auth/decide-entry";
import { googlePhotoOf } from "@/features/auth/google-photo-of";

/**
 * 로그인은 됐는데 앱이 뜨면서 프로필을 못 읽었을 때 서는 한 장이다. 어느 경로에서 실패했든
 * 여기다 — 게이트가 목적지를 못 정한 상태라 화면마다 다른 실패 모습을 그릴 수 없다.
 *
 * **조용히 재시도하지 않는다.** 앱이 뜨는 것처럼 보이는 빈 화면으로 몇 초를 쓰는 대신 바로
 * 말한다. 「다시 시도」는 판정을 통째로 다시 돌린다 — 성공하면 원래 가려던 자리가 그대로
 * 뜨고, 실패하면 이 화면이 그대로다. 몇 번째 실패인지 세지 않고 문구도 안 바꾼다.
 *
 * 정본은 `docs/2-design/modules/account/screens/login.md`의 「읽기 실패 짜임」이다.
 */

const SCREEN_BOTTOM_PADDING = 24;

export default function Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

  const onRetry = useCallback(async () => {
    setRetrying(true);

    const destination = await decideEntry({ client: supabase });

    setRetrying(false);

    if (destination !== "/retry") {
      router.replace(destination);
    }
  }, [router]);

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
    <View
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="flex-1 bg-bg-neutral px-6"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="server-error" />
        <Text className="text-center font-semibold text-xl text-fg-neutral">
          불러오지 못했어요
        </Text>
        <Text className="mt-2 text-center text-sm text-fg-neutral-muted">
          연결을 확인하고 다시 시도해 주세요
        </Text>
        <Button
          variant="primary"
          className="mt-8 self-stretch"
          loading={retrying}
          onPress={() => void onRetry()}
        >
          다시 시도
        </Button>
      </View>

      <View>
        <View className="my-5 h-px bg-stroke-neutral" />
        <View className="flex-row items-center justify-center gap-3">
          <Avatar name={email} photoUrl={photoUrl} size={24} />
          <Text className="text-sm text-fg-neutral-subtle">{email}</Text>
        </View>
        <Button variant="ghost" className="mt-4" onPress={onSignOut}>
          로그아웃
        </Button>
      </View>
    </View>
  );
}
