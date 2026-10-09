import { EllipsisVertical } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Screen } from "@/shared/ui/Screen";
import {
  MORE_HIT_SLOP,
  MORE_ICON_SIZE,
  PENDING_COPY,
} from "@/screens/membersPending/consts/membersPending.const";
import { useMembersPendingScreen } from "@/screens/membersPending/hooks/useMembersPendingScreen";
import { MembersPendingSheets } from "@/screens/membersPending/ui/MembersPendingSheets";
import { PendingEmpty } from "@/screens/membersPending/ui/PendingEmpty";
import { PendingLoading } from "@/screens/membersPending/ui/PendingLoading";
import { PendingRows } from "@/screens/membersPending/ui/PendingRows";

export function MembersPendingScreen() {
  const screen = useMembersPendingScreen();

  return (
    <Screen>
      <AppBar
        title={PENDING_COPY.appBarTitle}
        onBack={screen.goBack}
        right={
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={PENDING_COPY.more}
              hitSlop={MORE_HIT_SLOP}
              onPress={screen.toggleMenu}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={screen.menuOpen}>
              <MorePopoverItem
                label={PENDING_COPY.blockedMenu}
                onPress={screen.openBlocked}
              />
            </MorePopover>
          </View>
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          {screen.listState === "loading" ? <PendingLoading /> : null}
          {screen.listState === "empty" ? <PendingEmpty /> : null}
          {screen.listState === "rows" ? (
            <PendingRows rows={screen.rows} />
          ) : null}
        </View>
      </ScrollView>

      <MembersPendingSheets screen={screen} />

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
