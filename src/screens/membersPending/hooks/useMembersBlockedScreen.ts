import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
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

/**
 * 차단한 사람을 보고 차단을 푸는 화면의 controller다. 가입 대기 앱바의 더보기가 여는 화면이고
 * 정본은 `docs/2-design/modules/account/screens/membersPending.md`의 「차단한 사람 짜임」이다.
 *
 * **여기는 줄에서 바로 묻는다.** 상세 시트가 없다 — 여기서 하는 판단은 「이 사람 맞나」
 * 하나고 그건 사진과 이름이 답한다. 그래서 controller가 드는 것이 「누구에게 묻는 중인가」
 * 하나다.
 *
 * 푼 사람은 목록에서 빠진다. 승인 여부는 안 건드리고 `submitted_at`만 같이 비므로, 그 사람이
 * 프로필을 다시 보내야 가입 대기에 다시 선다.
 */

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

export function useMembersBlockedScreen(client: DB): MembersBlockedController {
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<BlockedToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: blocked, isLoading } = useMembersQuery(client, "blocked");

  const {
    mutate: sendUnblock,
    isPending: sending,
    isSuccess: unblocked,
    error,
    reset,
  } = useUnblockMemberMutation(client);

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
  const openName = open?.display_name ?? "";

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
    name: row.display_name ?? "",
    photoUrl: row.photo_url,
    detail: spellBlockedLine(row.blocked_at, now),
    press: () => setOpenId(row.id),
  }));

  return {
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
