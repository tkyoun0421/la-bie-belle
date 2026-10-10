import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_HOME_PATH,
  ADMIN_MEMBERS_BLOCKED_PATH,
} from "@/shared/consts/navigation.const";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import type { MemberSummary } from "@/entities/member/model/member.type";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import type { MemberAdminDone } from "@/features/memberAdmin/model/memberAdmin.type";
import { formatSentAt } from "@/screens/membersPending/utils/formatSentAt.utils";

export type PendingToast = MemberAdminDone;

export type PendingSheet = {
  profileId: string;
  name: string;
  photoUrl: string | null;
  sentAt: string;
  values: ProfilePrivate | null;
};

export type MembersPendingController = {
  goBack: () => void;
  openBlocked: () => void;
  today: string;
  sheet: PendingSheet | null;
  toast: PendingToast | null;
  openMember: (member: MemberSummary) => void;
  finish: (done: MemberAdminDone) => void;
  closeSheet: () => void;
  dismissToast: () => void;
  menuOpen: boolean;
  toggleMenu: () => void;
};

export function useMembersPendingScreen(): MembersPendingController {
  const router = useRouter();
  const [open, setOpen] = useState<MemberSummary | null>(null);
  const [toast, setToast] = useState<PendingToast | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const serverNowMs = useServerNow();
  const today = new Date(serverNowMs).toISOString();

  const { data: values } = useProfilePrivateQuery(supabase, open?.id ?? null);

  const closeSheet = useCallback(() => setOpen(null), []);

  const openMember = useCallback((member: MemberSummary) => {
    setMenuOpen(false);
    setOpen(member);
  }, []);

  const finish = useCallback((done: MemberAdminDone) => {
    setToast(done);
    setOpen(null);
  }, []);

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
    today,
    sheet:
      open === null
        ? null
        : {
            profileId: open.id,
            name: open.displayName ?? "",
            photoUrl: open.photoUrl,
            sentAt:
              open.submittedAt === null ? "" : formatSentAt(open.submittedAt),
            values: values ?? null,
          },
    toast,
    openMember,
    finish,
    closeSheet,
    dismissToast: () => setToast(null),
    menuOpen,
    toggleMenu: () => setMenuOpen((opened) => !opened),
  };
}
