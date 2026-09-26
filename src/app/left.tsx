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
import { googlePhotoOf } from "@/features/auth/google-photo-of";

/**
 * 퇴사한 사람이 앱을 열면 대시보드 대신 서는 자리다. 볼 수 있는 것은 지난 급여와 자기 근무
 * 기록까지고([ACC-011]), 갈 곳이 급여 하나라 버튼 하나로 끝난다 — 탭 바가 없다.
 *
 * 상태 배지도 도는 문구도 알림 영역도 없다. 셋 다 바뀔 것을 기다리는 자리의 장치인데 여기는
 * 기다림이 없다. 퇴사 날짜도 안 적는다 — 그만둔 날은 본인이 알고, 화면에 박으면 이 자리가
 * 통보처럼 읽힌다.
 *
 * 정본은 `docs/2-design/modules/account/screens/login.md`의 「퇴사한 뒤 짜임」이다.
 */

const SCREEN_BOTTOM_PADDING = 24;

export default function Screen() {
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
    <View
      style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
      className="flex-1 bg-bg-neutral px-6"
    >
      <View className="flex-1 items-center justify-center">
        <Illustration scene="farewell" />
        <Text className="text-center font-semibold text-xl text-fg-neutral">
          근무를 마치셨어요
        </Text>
        <Text className="mt-2 text-center text-sm text-fg-neutral-muted">
          지난 급여는 계속 볼 수 있어요
        </Text>
        <Button
          variant="primary"
          className="mt-8 self-stretch"
          onPress={() => router.push("/payroll")}
        >
          급여 보기
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
