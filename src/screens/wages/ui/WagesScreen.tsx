import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";
import { useWagesScreen } from "@/screens/wages/hooks/useWagesScreen";
import { DefaultWageSheet } from "@/screens/wages/ui/DefaultWageSheet";
import { MemberWageSheet } from "@/screens/wages/ui/MemberWageSheet";
import { ResetWageDialog } from "@/screens/wages/ui/ResetWageDialog";

const SKELETON_ROWS = [0, 1, 2];

export function WagesScreen() {
  const router = useRouter();
  const screen = useWagesScreen();

  return (
    <Screen floor="plain">
      <AppBar
        title={WAGES_COPY.appBarTitle}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          <View>
            <ListRow
              title={WAGES_COPY.baseTitle}
              value={screen.baseValue}
              chevron
              onPress={screen.openBase}
            />
            <Text size="xs" tone="subtle" numeric className="mt-1">
              {screen.baseNote}
            </Text>
          </View>

          <Divider className="my-2" />

          {screen.listState === "loading" ? (
            SKELETON_ROWS.map((at) => (
              <SkeletonLine key={at} className="my-4 w-2/3" />
            ))
          ) : screen.listState === "empty" ? (
            <EmptyState
              scene="no-members"
              title={WAGES_COPY.emptyTitle}
              description={WAGES_COPY.emptyBody}
            />
          ) : (
            screen.rows.map((row, at) => (
              <ListRow
                key={row.profileId}
                title={row.displayName}
                value={row.valueLabel}
                left={<Avatar name={row.displayName} photoUrl={row.photoUrl} />}
                chevron
                divider={at > 0}
                onPress={row.press}
              />
            ))
          )}
        </View>
      </ScrollView>

      {screen.sheet === "default" ? (
        <SheetLayer onDismiss={screen.close}>
          <DefaultWageSheet
            followerLine={screen.followerLine}
            amountText={screen.amountText}
            capHint={screen.capHint}
            canSave={screen.canSave}
            sending={screen.sending}
            failed={screen.failed}
            onDigits={screen.write}
            onClose={screen.close}
            onSave={screen.save}
          />
        </SheetLayer>
      ) : null}

      {screen.member === null ? null : (
        <SheetLayer onDismiss={screen.close}>
          <MemberWageSheet
            name={screen.member.displayName}
            photoUrl={screen.member.photoUrl}
            historyRows={screen.historyRows}
            historyHasMore={screen.historyHasMore}
            amountText={screen.amountText}
            capHint={screen.capHint}
            canSave={screen.canSave}
            canReset={screen.canReset}
            sending={screen.sending}
            failed={screen.failed}
            onDigits={screen.write}
            onExpand={screen.expandHistory}
            onReset={screen.askReset}
            onClose={screen.close}
            onSave={screen.save}
          />
        </SheetLayer>
      )}

      <ResetWageDialog
        visible={screen.asking}
        body={screen.resetBody}
        notice={screen.resetNotice}
        onClose={screen.cancelReset}
        onConfirm={screen.confirmReset}
      />

      {screen.toast ? (
        <FloatingToast message={screen.toast} onDone={screen.dismissToast} />
      ) : null}
    </Screen>
  );
}
