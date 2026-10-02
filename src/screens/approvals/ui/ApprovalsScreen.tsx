import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
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

/**
 * 관리자가 근무자에게서 온 요청에 답하는 화면이다. 정본은
 * `docs/2-design/system/screens/approvals.md`고 완료 조건은
 * `docs/2-design/spec/schedule-requests.md`의 AC-05다.
 *
 * **줄에서 바로 답하지 않는다.** 누르면 시트가 올라오고 거기서 정한다 — 승인도 거절도
 * 되돌릴 수 없고 끝난 것을 보는 자리도 없어서, 글을 다 읽은 자리에서만 누르게 한다.
 *
 * **근무 취소 승인만 한 번 더 묻는다.** 누르는 순간 자리가 비고 근무자에게 알림이 나간다.
 * 승인한 뒤에는 목록으로 안 돌아가고 그 자리를 채우는 날 상세로 넘어간다 — 승인한 관리자가
 * 이어서 할 일이 그것 하나다. 토스트 「근무를 취소했어요」는 넘어간 화면이 띄운다
 * (`?from=approvals`).
 *
 * **화면이 먼저 움직이지 않는다.** 응답이 온 뒤에 줄을 뺀다
 * ([runtime.md](../../../../docs/2-design/system/runtime.md#낙관적-업데이트)).
 *
 * **지금 서는 줄은 근무 취소뿐이다.** 사유 줄은 `attendance-excuse`가 같은 목록에 잇는다
 * (plan 「범위 밖」).
 *
 * **`useState`가 하나도 없다.** 목록과 시트와 확인창의 상태가 전부 통신에 매여 있어
 * [`useApprovalsScreen`](../hooks/useApprovalsScreen.ts)이 든다.
 */

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

  const screen = useApprovalsScreen(supabase, bearings);

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
