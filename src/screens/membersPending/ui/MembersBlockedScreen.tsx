import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import {
  BLOCKED_COPY,
  UNBLOCK_CONFIRM_TEST_ID,
} from "@/screens/membersPending/consts/membersPending.const";
import { useMembersBlockedScreen } from "@/screens/membersPending/hooks/useMembersBlockedScreen";

/**
 * 차단한 사람을 보고 차단을 푸는 자리다. 가입 대기 앱바의 더보기가 여는 화면이고 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「차단한 사람 짜임」이다.
 *
 * **여기는 줄에서 바로 누른다.** 상세 시트가 없다 — 여기서 하는 판단은 「이 사람 맞나」
 * 하나고 그건 사진과 이름이 답한다. 확인 시트에도 사진과 이름을 다시 안 세운다.
 */

/**
 * **같은 표가 저장소 열세 자리에 있다.** 묶음 여럿에 걸려 한 열이 못 접고 AC-13이 받는다.
 */
const SKELETON_ROWS = [0, 1];

export function MembersBlockedScreen() {
  const router = useRouter();
  const screen = useMembersBlockedScreen(supabase);

  return (
    <Screen>
      <AppBar
        title={BLOCKED_COPY.appBarTitle}
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace("/admin/members/pending")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          {screen.listState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.listState === "empty" ? (
            <Text size="sm" tone="subtle" className="py-4">
              {BLOCKED_COPY.empty}
            </Text>
          ) : (
            <Card className="py-0">
              {screen.rows.map((row, at) => (
                <ListRow
                  key={row.id}
                  title={row.name}
                  detail={row.detail}
                  left={<Avatar name={row.name} photoUrl={row.photoUrl} />}
                  right={
                    <Button
                      variant="secondary"
                      size="compact"
                      onPress={row.press}
                    >
                      {BLOCKED_COPY.unblock}
                    </Button>
                  }
                  divider={at > 0}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {screen.confirming ? (
        <SheetLayer onDismiss={screen.close}>
          <Text size="base" weight="medium">
            {screen.confirming.question}
          </Text>
          <Text size="sm" tone="muted" className="mt-1">
            {BLOCKED_COPY.confirmNote}
          </Text>

          {screen.failed ? (
            <Text size="xs" tone="critical" className="mt-3">
              {BLOCKED_COPY.sendFailed}
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={screen.close}
            >
              {BLOCKED_COPY.close}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              testID={UNBLOCK_CONFIRM_TEST_ID}
              loading={screen.sending}
              onPress={screen.unblock}
            >
              {BLOCKED_COPY.unblock}
            </Button>
          </View>
        </SheetLayer>
      ) : null}

      {screen.toast ? (
        <FloatingToast
          kind={screen.toast.kind}
          message={screen.toast.message}
          onDone={screen.dismissToast}
        />
      ) : null}
    </Screen>
  );
}
