import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ADMIN_HOME_PATH } from "@/shared/consts/navigation.const";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import type { ActiveMember, Member } from "@/entities/member/model/member.type";
import { PERMISSION_OF_OTHERS } from "@/entities/notification/consts/notification.const";
import { getReachState } from "@/entities/notification/model/reachState.policy";
import {
  getMemberListSuffix,
  getMemberSheetLine,
} from "@/entities/notification/utils/reachMessage.utils";
import type { MemberAdminDone } from "@/features/memberAdmin/model/memberAdmin.type";

export type MembersToast = MemberAdminDone;

export type MembersSheet = {
  name: string;
  member: Member;
};

export type MembersScreenController = {
  goBack: () => void;
  query: string;
  expanded: boolean;
  sheet: MembersSheet | null;
  today: string;
  lastAdmin: boolean;
  reachLine: string | null;
  toast: MembersToast | null;
  noteOf: (member: ActiveMember) => string | null;
  search: (typed: string) => void;
  expand: () => void;
  openMember: (member: Member, lastAdmin: boolean) => void;
  finish: (done: MemberAdminDone) => void;
  close: () => void;
  dismissToast: () => void;
};

type Open = {
  member: Member;
  lastAdmin: boolean;
};

function isActive(member: Member): member is ActiveMember {
  return "notificationsEnabled" in member;
}

function reachOf(member: Member): string | null {
  if (!isActive(member)) {
    return null;
  }

  return getMemberSheetLine(
    getReachState({
      notificationsEnabled: member.notificationsEnabled,
      hasDevice: member.hasDevice,
      permission: PERMISSION_OF_OTHERS,
    }),
    true,
  );
}

export function useMembersScreen(): MembersScreenController {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<Open | null>(null);
  const [toast, setToast] = useState<MembersToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const close = useCallback(() => setOpen(null), []);

  const openMember = useCallback((member: Member, lastAdmin: boolean) => {
    setOpen({ member, lastAdmin });
  }, []);

  const finish = useCallback((done: MemberAdminDone) => {
    setToast(done);
    setOpen(null);
  }, []);

  const noteOf = useCallback(
    (member: ActiveMember) =>
      getMemberListSuffix(
        getReachState({
          notificationsEnabled: member.notificationsEnabled,
          hasDevice: member.hasDevice,
          permission: PERMISSION_OF_OTHERS,
        }),
        true,
      ),
    [],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

  return {
    goBack,
    query,
    expanded,
    sheet:
      open === null
        ? null
        : { name: open.member.displayName ?? "", member: open.member },
    today: now,
    lastAdmin: open?.lastAdmin ?? false,
    reachLine: open === null ? null : reachOf(open.member),
    toast,
    noteOf,
    search: setQuery,
    expand: () => setExpanded(true),
    openMember,
    finish,
    close,
    dismissToast: () => setToast(null),
  };
}
