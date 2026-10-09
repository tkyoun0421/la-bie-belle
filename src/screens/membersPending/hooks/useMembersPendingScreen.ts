import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_HOME_PATH,
  MEMBERS_BLOCKED_PATH,
} from "@/shared/consts/navigation.const";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { ToastKind } from "@/shared/ui/Toast";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import { useApproveMemberMutation } from "@/features/memberAdmin/services/useApproveMemberMutation";
import { useBlockMemberMutation } from "@/features/memberAdmin/services/useBlockMemberMutation";
import { useRejectMemberMutation } from "@/features/memberAdmin/services/useRejectMemberMutation";
import { PENDING_COPY } from "@/screens/membersPending/consts/membersPending.const";
import type { SheetFace } from "@/screens/membersPending/model/membersPending.type";
import { spellSentLine } from "@/screens/membersPending/utils/elapsedLine.utils";
import { formatSentAt } from "@/screens/membersPending/utils/formatSentAt.utils";

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
  values: ProfilePrivate | null;
};

export type PendingListState = "loading" | "empty" | "rows";

export type MembersPendingController = {
  goBack: () => void;
  openBlocked: () => void;
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
  menuOpen: boolean;
  toggleMenu: () => void;
};

export function useMembersPendingScreen(): MembersPendingController {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<SheetFace>("detail");
  const [toast, setToast] = useState<PendingToast | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const clockOffset = serverClockStore((at) => at.offset);
  const today = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: pending, isLoading } = useMembersQuery(supabase, "pending");
  const { data: values } = useProfilePrivateQuery(supabase, openId);

  const {
    mutate: sendApprove,
    isPending: approving,
    isSuccess: approved,
    error: approveError,
    reset: resetApprove,
  } = useApproveMemberMutation(supabase);

  const {
    mutate: sendReject,
    isPending: rejecting,
    isSuccess: rejected,
    error: rejectError,
    reset: resetReject,
  } = useRejectMemberMutation(supabase);

  const {
    mutate: sendBlock,
    isPending: blocking,
    isSuccess: blocked,
    error: blockError,
    reset: resetBlock,
  } = useBlockMemberMutation(supabase);

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    resetApprove();
    resetReject();
    resetBlock();
  }, [resetApprove, resetReject, resetBlock]);

  const finish = useCallback(
    (toasted: PendingToast) => {
      setToast(toasted);
      closeSheet();
    },
    [closeSheet],
  );

  const open = pending?.find((row) => row.id === openId) ?? null;
  const openName = open?.displayName ?? "";

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
    name: row.displayName ?? "",
    photoUrl: row.photoUrl,
    detail: spellSentLine(row.submittedAt, today),
    press: () => {
      setMenuOpen(false);
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
          photoUrl: open.photoUrl,
          sentAt:
            open.submittedAt === null ? "" : formatSentAt(open.submittedAt),
          values: values ?? null,
        };

  const confirm = useCallback(() => {
    if (open === null || face === "detail") {
      return;
    }

    const send = face === "reject" ? sendReject : sendBlock;

    send({ profileId: open.id });
  }, [open, face, sendReject, sendBlock]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

  const openBlocked = useCallback(() => {
    setMenuOpen(false);
    router.push(MEMBERS_BLOCKED_PATH);
  }, [router]);

  return {
    goBack,
    openBlocked,
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
    menuOpen,
    toggleMenu: () => setMenuOpen((opened) => !opened),
  };
}
