import { useRouter } from "expo-router";
import { EllipsisVertical } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import {
  MORE_HIT_SLOP,
  MORE_ICON_SIZE,
  PENDING_COPY,
} from "@/screens/membersPending/consts/membersPending.const";
import { useMembersPendingScreen } from "@/screens/membersPending/hooks/useMembersPendingScreen";
import { MemberDetailSheet } from "@/screens/membersPending/ui/MemberDetailSheet";

/**
 * 관리자가 가입 신청을 받거나 돌려보내는 화면이다. 앱 전체의 첫 문이다 — 승인이 없으면
 * 근무표도 급여도 안 열린다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`고 완료 조건은
 * `docs/2-design/spec/members-pending.md`다.
 *
 * **줄에서 바로 판정하지 않는다.** 누르면 시트가 올라오고 거기서 정한다. 줄에서 승인하면
 * 성별과 생년월일과 연락처를 못 보고 누르게 되는데 그 셋이 관리자가 사람을 알아보는 재료다.
 *
 * 판정과 시트 열림은 `useMembersPendingScreen`이 든다. 여기 남은 `useState`는 앱바 더보기
 * 하나다 — 사람이 열고 사람이 닫는 자리라 통신을 안 탄다.
 */

/**
 * **같은 표가 저장소 열세 자리에 있다.** 묶음 여럿에 걸려 한 열이 못 접고 AC-13이 받는다.
 */
const SKELETON_ROWS = [0, 1, 2];

export function MembersPendingScreen() {
  const router = useRouter();
  const screen = useMembersPendingScreen(supabase);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Screen>
      <AppBar
        title={PENDING_COPY.appBarTitle}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
        right={
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={PENDING_COPY.more}
              hitSlop={MORE_HIT_SLOP}
              onPress={() => setMenuOpen((opened) => !opened)}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={menuOpen}>
              <MorePopoverItem
                label={PENDING_COPY.blockedMenu}
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/admin/members/blocked");
                }}
              />
            </MorePopover>
          </View>
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
              {PENDING_COPY.empty}
            </Text>
          ) : (
            <Card className="py-0">
              {screen.rows.map((row, at) => (
                <ListRow
                  key={row.id}
                  title={row.name}
                  detail={row.detail}
                  left={<Avatar name={row.name} photoUrl={row.photoUrl} />}
                  chevron
                  divider={at > 0}
                  onPress={() => {
                    setMenuOpen(false);
                    row.press();
                  }}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {screen.sheet ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <MemberDetailSheet
            name={screen.sheet.name}
            photoUrl={screen.sheet.photoUrl}
            sentAt={screen.sheet.sentAt}
            values={screen.sheet.values}
            today={screen.today}
            face={screen.face}
            sending={screen.sending}
            failed={screen.failed}
            onFace={screen.showFace}
            onApprove={screen.approve}
            onConfirm={screen.confirm}
          />
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
