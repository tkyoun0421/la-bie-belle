import { useRouter } from "expo-router";
import { EllipsisVertical } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
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

const SKELETON_ROWS = [0, 1, 2];

export function MembersPendingScreen() {
  const router = useRouter();
  const screen = useMembersPendingScreen();
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
