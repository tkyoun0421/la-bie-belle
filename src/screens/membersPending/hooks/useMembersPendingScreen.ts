import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_HOME_PATH,
  ADMIN_MEMBERS_BLOCKED_PATH,
} from "@/shared/consts/navigation.const";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import type { MemberAdminDone } from "@/features/memberAdmin/model/memberAdmin.type";
import { spellSentLine } from "@/screens/membersPending/utils/elapsedLine.utils";
import { formatSentAt } from "@/screens/membersPending/utils/formatSentAt.utils";

export type PendingToast = MemberAdminDone;

export type PendingRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  detail: string;
  press: () => void;
};

export type PendingSheet = {
  profileId: string;
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
  toast: PendingToast | null;
  finish: (done: MemberAdminDone) => void;
  closeSheet: () => void;
  dismissToast: () => void;
  menuOpen: boolean;
  toggleMenu: () => void;
};

export function useMembersPendingScreen(): MembersPendingController {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<PendingToast | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const clockOffset = serverClockStore((at) => at.offset);
  const today = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: pending, isLoading } = useMembersQuery(supabase, "pending");
  const { data: values } = useProfilePrivateQuery(supabase, openId);

  const closeSheet = useCallback(() => setOpenId(null), []);

  const finish = useCallback((done: MemberAdminDone) => {
    setToast(done);
    setOpenId(null);
  }, []);

  const open = pending?.find((row) => row.id === openId) ?? null;

  const rows: PendingRow[] = (pending ?? []).map((row) => ({
    id: row.id,
    name: row.displayName ?? "",
    photoUrl: row.photoUrl,
    detail: spellSentLine(row.submittedAt, today),
    press: () => {
      setMenuOpen(false);
      setOpenId(row.id);
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
          profileId: open.id,
          name: open.displayName ?? "",
          photoUrl: open.photoUrl,
          sentAt:
            open.submittedAt === null ? "" : formatSentAt(open.submittedAt),
          values: values ?? null,
        };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

  const openBlocked = useCallback(() => {
    setMenuOpen(false);
    router.push(ADMIN_MEMBERS_BLOCKED_PATH);
  }, [router]);

  return {
    goBack,
    openBlocked,
    listState,
    rows,
    today,
    sheet,
    toast,
    finish,
    closeSheet,
    dismissToast: () => setToast(null),
    menuOpen,
    toggleMenu: () => setMenuOpen((opened) => !opened),
  };
}
