import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { ToastKind } from "@/shared/ui/Toast";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import type { ProfilePrivateRow } from "@/entities/profile/api/profile.dto";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import { useApproveMemberMutation } from "@/features/memberAdmin/services/useApproveMemberMutation";
import { useBlockMemberMutation } from "@/features/memberAdmin/services/useBlockMemberMutation";
import { useRejectMemberMutation } from "@/features/memberAdmin/services/useRejectMemberMutation";
import { PENDING_COPY } from "@/screens/membersPending/consts/membersPending.const";
import type { SheetFace } from "@/screens/membersPending/model/membersPending.type";
import { spellSentLine } from "@/screens/membersPending/utils/elapsedLine.utils";
import { formatSentAt } from "@/screens/membersPending/utils/formatSentAt.utils";

/**
 * 관리자가 가입 신청을 받거나 돌려보내는 화면의 controller다. 앱 전체의 첫 문이다 — 승인이
 * 없으면 근무표도 급여도 안 열린다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`고 완료 조건은
 * `docs/2-design/spec/members-pending.md`다.
 *
 * **판정 셋이 한 꼴이다.** 승인·거절·차단이 성공하면 시트를 닫고 이름이 든 토스트를 세운다 —
 * 말만 다르다. 그래서 「시트가 열려 있나」가 통신 결과에 매여 있고 화면 것이 아니다.
 *
 * **늦게 누른 쪽은 `already_decided`를 받는다.** 그때는 시트를 닫고 안내 토스트를 세운다 —
 * 목록은 Mutation이 이미 낡게 해서 이미 처리된 사람의 줄이 다음 읽기에 안 선다. 통신이 끊긴
 * 것이면 시트를 연 채로 둔다. 사람이 다시 누를 자리가 거기다.
 *
 * **얼굴은 controller가 든다.** 거절과 차단이 상세 시트의 값 넷 자리를 물음으로 바꾸는데,
 * 성공하면 시트째 닫혀 그 자리가 사라진다 — 사람이 열고 사람이 닫는 상태가 아니다.
 */

export type PendingToast = { kind: ToastKind; message: string };

export type PendingRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  detail: string;
  press: () => void;
};

export type PendingSheet = {
  name: string;
  photoUrl: string | null;
  sentAt: string;
  values: ProfilePrivateRow | null;
};

export type PendingListState = "loading" | "empty" | "rows";

export type MembersPendingController = {
  listState: PendingListState;
  rows: PendingRow[];
  today: string;
  sheet: PendingSheet | null;
  face: SheetFace;
  sending: boolean;
  failed: boolean;
  toast: PendingToast | null;
  approve: () => void;
  showFace: (face: SheetFace) => void;
  confirm: () => void;
  closeSheet: () => void;
  dismissToast: () => void;
};

export function useMembersPendingScreen(client: DB): MembersPendingController {
  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<SheetFace>("detail");
  const [toast, setToast] = useState<PendingToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const today = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: pending, isLoading } = useMembersQuery(client, "pending");
  const { data: values } = useProfilePrivateQuery(client, openId);

  const {
    mutate: sendApprove,
    isPending: approving,
    isSuccess: approved,
    error: approveError,
    reset: resetApprove,
  } = useApproveMemberMutation(client);

  const {
    mutate: sendReject,
    isPending: rejecting,
    isSuccess: rejected,
    error: rejectError,
    reset: resetReject,
  } = useRejectMemberMutation(client);

  const {
    mutate: sendBlock,
    isPending: blocking,
    isSuccess: blocked,
    error: blockError,
    reset: resetBlock,
  } = useBlockMemberMutation(client);

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    resetApprove();
    resetReject();
    resetBlock();
  }, [resetApprove, resetReject, resetBlock]);

  /**
   * 성공한 쓰기가 셋 다 여기로 온다 — 토스트를 세우고 시트를 닫는다. 닫으면서 Mutation을
   * 비우므로 `isSuccess`가 내려가 같은 효과가 두 번 안 돈다.
   */
  const finish = useCallback(
    (toasted: PendingToast) => {
      setToast(toasted);
      closeSheet();
    },
    [closeSheet],
  );

  const open = pending?.find((row) => row.id === openId) ?? null;
  const openName = open?.display_name ?? "";

  useEffect(() => {
    if (approved) {
      finish({
        kind: "success",
        message: `${openName}${PENDING_COPY.approvedSuffix}`,
      });
    }
  }, [approved, openName, finish]);

  useEffect(() => {
    if (rejected) {
      finish({
        kind: "success",
        message: `${openName}${PENDING_COPY.rejectedSuffix}`,
      });
    }
  }, [rejected, openName, finish]);

  useEffect(() => {
    if (blocked) {
      finish({
        kind: "success",
        message: `${openName}${PENDING_COPY.blockedSuffix}`,
      });
    }
  }, [blocked, openName, finish]);

  const errors = [approveError, rejectError, blockError];
  const decided = errors.map(errorCodeOf).includes("already_decided");

  /** 서버가 이유를 말해 준 것 말고는 전부 「보내지 못했어요」다 — 시트가 열린 채로 선다. */
  const failed = errors.some(
    (error) => error !== null && errorCodeOf(error) !== "already_decided",
  );

  useEffect(() => {
    if (decided) {
      finish({ kind: "info", message: PENDING_COPY.alreadyDecided });
    }
  }, [decided, finish]);

  const rows: PendingRow[] = (pending ?? []).map((row) => ({
    id: row.id,
    name: row.display_name ?? "",
    photoUrl: row.photo_url,
    detail: spellSentLine(row.submitted_at, today),
    press: () => {
      setOpenId(row.id);
      setFace("detail");
    },
  }));

  const listState: PendingListState = isLoading
    ? "loading"
    : rows.length === 0
      ? "empty"
      : "rows";

  const sheet: PendingSheet | null =
    open === null
      ? null
      : {
          name: openName,
          photoUrl: open.photo_url,
          sentAt:
            open.submitted_at === null ? "" : formatSentAt(open.submitted_at),
          values: values ?? null,
        };

  const confirm = useCallback(() => {
    if (open === null || face === "detail") {
      return;
    }

    const send = face === "reject" ? sendReject : sendBlock;

    send({ profileId: open.id });
  }, [open, face, sendReject, sendBlock]);

  return {
    listState,
    rows,
    today,
    sheet,
    face,
    sending: approving || rejecting || blocking,
    failed,
    toast,
    approve: () => {
      if (open !== null) {
        sendApprove({ profileId: open.id });
      }
    },
    showFace: setFace,
    confirm,
    closeSheet,
    dismissToast: () => setToast(null),
  };
}
