import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { MEMBERS_PENDING_PATH } from "@/shared/consts/navigation.const";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { ToastKind } from "@/shared/ui/Toast";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { useUnblockMemberMutation } from "@/features/memberAdmin/services/useUnblockMemberMutation";
import {
  BLOCKED_COPY,
  PENDING_COPY,
} from "@/screens/membersPending/consts/membersPending.const";
import { spellBlockedLine } from "@/screens/membersPending/utils/elapsedLine.utils";

export type BlockedToast = { kind: ToastKind; message: string };

export type BlockedRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  detail: string;
  press: () => void;
};

export type BlockedConfirm = {
  question: string;
};

export type BlockedListState = "loading" | "empty" | "rows";

export type MembersBlockedController = {
  goBack: () => void;
  listState: BlockedListState;
  rows: BlockedRow[];
  confirming: BlockedConfirm | null;
  sending: boolean;
  failed: boolean;
  toast: BlockedToast | null;
  unblock: () => void;
  close: () => void;
  dismissToast: () => void;
};

export function useMembersBlockedScreen(): MembersBlockedController {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<BlockedToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: blocked, isLoading } = useMembersQuery(supabase, "blocked");

  const {
    mutate: sendUnblock,
    isPending: sending,
    isSuccess: unblocked,
    error,
    reset,
  } = useUnblockMemberMutation(supabase);

  const close = useCallback(() => {
    setOpenId(null);
    reset();
  }, [reset]);

  const finish = useCallback(
    (toasted: BlockedToast) => {
      setToast(toasted);
      close();
    },
    [close],
  );

  const open = blocked?.find((row) => row.id === openId) ?? null;
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

  useEffect(() => {
    if (code === "already_decided") {
      finish({ kind: "info", message: PENDING_COPY.alreadyDecided });
    }
  }, [code, finish]);

  const rows: BlockedRow[] = (blocked ?? []).map((row) => ({
    id: row.id,
    name: row.displayName ?? "",
    photoUrl: row.photoUrl,
    detail: spellBlockedLine(row.blockedAt, now),
    press: () => setOpenId(row.id),
  }));

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(MEMBERS_PENDING_PATH);
  }, [router]);

  return {
    goBack,
    listState: isLoading ? "loading" : rows.length === 0 ? "empty" : "rows",
    rows,
    confirming:
      open === null
        ? null
        : { question: `${openName}${BLOCKED_COPY.confirmSuffix}` },
    sending,
    failed: error !== null && code !== "already_decided",
    toast,
    unblock: () => {
      if (open !== null) {
        sendUnblock({ profileId: open.id });
      }
    },
    close,
    dismissToast: () => setToast(null),
  };
}
