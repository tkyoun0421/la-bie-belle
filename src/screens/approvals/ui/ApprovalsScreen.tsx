import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import type { PendingApproval } from "@/entities/workRequest/api/getPendingApprovals.api";
import { usePendingApprovalsQuery } from "@/entities/workRequest/hooks/usePendingApprovalsQuery";
import type { CancelDecision } from "@/features/workRequest/api/decideCancelRequest.api";
import { useDecideCancelRequestMutation } from "@/features/workRequest/hooks/useDecideCancelRequestMutation";
import {
  cancelApprovalConfirmBody,
  cancelApprovalDetail,
  cancelApprovalRowTitle,
} from "@/screens/approvals/model/approvalDetail";
import {
  removeApproval,
  sortApprovals,
  type ApprovalListRow,
} from "@/screens/approvals/model/approvalsList";
import {
  ApprovalDetailSheet,
  type ApprovalSheetFace,
} from "@/screens/approvals/ui/ApprovalDetailSheet";

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
 */

const SKELETON_ROWS = [0, 1, 2];

type CancelRow = ApprovalListRow & { source: PendingApproval };

type SentDecision = { row: CancelRow; decision: CancelDecision };

function rowsOf(approvals: PendingApproval[]): CancelRow[] {
  return sortApprovals(
    approvals.map((one) => ({
      id: one.id,
      kind: "cancel" as const,
      workDate: one.assignments.days.work_date,
      source: one,
    })),
  );
}

function detailOf(row: CancelRow) {
  return cancelApprovalDetail({
    displayName: row.source.profiles?.display_name ?? "",
    workDate: row.workDate,
    position: row.source.assignments.position,
    startsAt: row.source.assignments.days.starts_at,
    endsAt: row.source.assignments.days.ends_at,
    sentAt: row.source.created_at,
    reason: row.source.reason,
  });
}

function namesOf(row: CancelRow) {
  return {
    displayName: row.source.profiles?.display_name ?? "",
    workDate: row.workDate,
    position: row.source.assignments.position,
  };
}

export function ApprovalsScreen() {
  const router = useRouter();

  const { data: approvals } = usePendingApprovalsQuery(supabase);
  const { mutate, isPending, isSuccess, isError, reset } =
    useDecideCancelRequestMutation(supabase);

  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<ApprovalSheetFace>("detail");
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState<SentDecision | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const hideToast = useCallback(() => setToast(null), []);

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    setConfirming(false);
    reset();
  }, [reset]);

  useEffect(() => {
    if (!isSuccess || sent === null) {
      return;
    }

    setAnswered(sent.row.id);
    setOpenId(null);
    setFace("detail");
    setConfirming(false);
    setSent(null);
    reset();

    if (sent.decision === "approved") {
      router.replace(
        `/admin/schedule?date=${sent.row.workDate}&from=approvals`,
      );
      return;
    }

    setToast("거절했어요");
  }, [isSuccess, sent, reset, router]);

  const rows = rowsOf(approvals ?? []);
  const visible = answered === null ? rows : removeApproval(rows, answered);
  const open = visible.find((row) => row.id === openId) ?? null;

  return (
    <Screen>
      <AppBar
        title="승인할 일"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          {approvals === undefined ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : visible.length === 0 ? (
            <Card>
              <EmptyState
                scene="all-clear"
                title="승인할 일이 없어요"
                description="사유나 근무 취소가 오면 여기 서요"
              />
            </Card>
          ) : (
            <Card className="py-0">
              {visible.map((row, at) => (
                <ListRow
                  key={row.id}
                  title={cancelApprovalRowTitle(namesOf(row))}
                  detail={row.source.reason}
                  left={<Badge variant="neutral" size="sm" label="근무 취소" />}
                  chevron
                  divider={at > 0}
                  onPress={() => {
                    setOpenId(row.id);
                    setFace("detail");
                    reset();
                  }}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {open ? (
        <SheetLayer onDismiss={closeSheet}>
          <ApprovalDetailSheet
            detail={detailOf(open)}
            face={face}
            sending={isPending}
            failed={isError}
            onFace={setFace}
            onApprove={() => setConfirming(true)}
            onReject={(reason) => {
              setSent({ row: open, decision: "rejected" });
              mutate({
                cancelRequestId: open.id,
                decision: "rejected",
                reason,
              });
            }}
          />
        </SheetLayer>
      ) : null}

      {open ? (
        <Dialog
          visible={confirming}
          title="근무를 취소할까요?"
          notice={isError ? "보내지 못했어요. 다시 시도해주세요" : undefined}
          closeLabel="뒤로"
          confirmLabel={isError ? "다시 시도" : "취소 승인"}
          destructive
          onClose={() => {
            setConfirming(false);
            reset();
          }}
          onConfirm={() => {
            setSent({ row: open, decision: "approved" });
            mutate({ cancelRequestId: open.id, decision: "approved" });
          }}
        >
          {cancelApprovalConfirmBody(namesOf(open))}
        </Dialog>
      ) : null}

      {toast ? (
        <FloatingToast kind="success" message={toast} onDone={hideToast} />
      ) : null}
    </Screen>
  );
}
