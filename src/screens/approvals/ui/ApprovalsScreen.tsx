import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";
import { useApprovalsScreen } from "@/screens/approvals/hooks/useApprovalsScreen";
import { ApprovalDetailSheet } from "@/screens/approvals/ui/ApprovalDetailSheet";

const SKELETON_ROWS = [0, 1, 2];

export function ApprovalsScreen() {
  const router = useRouter();

  const bearings = useMemo(
    () => ({
      canGoBack: () => router.canGoBack(),
      back: () => router.back(),
      replace: (destination: string) => router.replace(destination as Href),
    }),
    [router],
  );

  const screen = useApprovalsScreen(bearings);

  return (
    <Screen>
      <AppBar title={APPROVALS_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-5">
          {screen.listState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.listState === "empty" ? (
            <Card>
              <EmptyState
                scene="all-clear"
                title={APPROVALS_COPY.emptyTitle}
                description={APPROVALS_COPY.emptyBody}
              />
            </Card>
          ) : (
            <Card className="py-0">
              {screen.rows.map((row, at) => (
                <ListRow
                  key={row.id}
                  title={row.title}
                  detail={row.detail}
                  left={
                    <Badge
                      variant="neutral"
                      size="sm"
                      label={APPROVALS_COPY.cancelBadge}
                    />
                  }
                  chevron
                  divider={at > 0}
                  onPress={row.press}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {screen.detail === null ? null : (
        <SheetLayer onDismiss={screen.closeSheet}>
          <ApprovalDetailSheet
            detail={screen.detail}
            face={screen.face}
            sending={screen.sending}
            failed={screen.failed}
            chosen={screen.chosen}
            written={screen.written}
            canSend={screen.canSend}
            sendLabel={screen.sendLabel}
            onFace={screen.showFace}
            onApprove={screen.askApprove}
            onChoose={screen.choose}
            onWrite={screen.write}
            onReject={screen.reject}
          />
        </SheetLayer>
      )}

      <Dialog
        visible={screen.confirming}
        title={APPROVALS_COPY.confirmTitle}
        notice={screen.confirmNotice}
        closeLabel={APPROVALS_COPY.confirmBack}
        confirmLabel={screen.confirmLabel}
        destructive
        onClose={screen.cancelApprove}
        onConfirm={screen.approve}
      >
        {screen.confirmBody}
      </Dialog>

      {screen.toast ? (
        <FloatingToast
          kind="success"
          message={screen.toast}
          onDone={screen.dismissToast}
        />
      ) : null}
    </Screen>
  );
}
