import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { ADMIN_MEMBERS_PENDING_PATH } from "@/shared/consts/navigation.const";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { ToastKind } from "@/shared/ui/Toast";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import { MEMBER_DECISION_COPY } from "@/entities/member/consts/member.const";
import type { MemberSummary } from "@/entities/member/model/member.type";
import { useUnblockMemberMutation } from "@/features/memberAdmin/services/useUnblockMemberMutation";
import { BLOCKED_COPY } from "@/screens/membersPending/consts/membersPending.const";

export type BlockedToast = { kind: ToastKind; message: string };

export type BlockedConfirm = {
  question: string;
};

export type MembersBlockedController = {
  goBack: () => void;
  today: string;
  confirming: BlockedConfirm | null;
  sending: boolean;
  failedLine: string | null;
  toast: BlockedToast | null;
  openMember: (member: MemberSummary) => void;
  unblock: () => void;
  close: () => void;
  dismissToast: () => void;
};

export function useMembersBlockedScreen(): MembersBlockedController {
  const router = useRouter();
  const [open, setOpen] = useState<MemberSummary | null>(null);
  const [toast, setToast] = useState<BlockedToast | null>(null);

  const serverNowMs = useServerNow();
  const now = new Date(serverNowMs).toISOString();

  const {
    mutate: sendUnblock,
    isPending: sending,
    isSuccess: unblocked,
    error,
    reset,
  } = useUnblockMemberMutation(supabase);

  const close = useCallback(() => {
    setOpen(null);
    reset();
  }, [reset]);

  const finish = useCallback(
    (toasted: BlockedToast) => {
      setToast(toasted);
      close();
    },
    [close],
  );

  const openName = open?.displayName ?? "";

  useEffect(() => {
    if (unblocked) {
      finish({
        kind: "success",
        message: `${openName}${BLOCKED_COPY.unblockedSuffix}`,
      });
    }
  }, [unblocked, openName, finish]);

  const code = errorCodeOf(error);
  const failed = error !== null && code !== "already_decided";

  useEffect(() => {
    if (code === "already_decided") {
      finish({ kind: "info", message: MEMBER_DECISION_COPY.alreadyDecided });
    }
  }, [code, finish]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_MEMBERS_PENDING_PATH);
  }, [router]);

  return {
    goBack,
    today: now,
    confirming:
      open === null
        ? null
        : { question: `${openName}${BLOCKED_COPY.confirmSuffix}` },
    sending,
    failedLine: failed ? BLOCKED_COPY.sendFailed : null,
    toast,
    openMember: setOpen,
    unblock: () => {
      if (open !== null) {
        sendUnblock({ profileId: open.id });
      }
    },
    close,
    dismissToast: () => setToast(null),
  };
}
