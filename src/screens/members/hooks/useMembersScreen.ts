import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { ADMIN_HOME_PATH } from "@/shared/consts/navigation.const";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { isLastAdmin } from "@/entities/member/model/isLastAdmin.policy";
import type { Member } from "@/entities/member/model/member.type";
import { isLeftOverAYear } from "@/entities/member/model/sortMembers.policy";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { searchMembers } from "@/entities/member/utils/searchMembers.utils";
import { spellLeftAt } from "@/entities/member/utils/spellLeftAt.utils";
import { PERMISSION_OF_OTHERS } from "@/entities/notification/consts/notification.const";
import { getReachState } from "@/entities/notification/model/reachState.policy";
import {
  getMemberListSuffix,
  getMemberSheetLine,
} from "@/entities/notification/utils/reachMessage.utils";
import type { MemberAdminDone } from "@/features/memberAdmin/model/memberAdmin.type";

export type MembersListState = "loading" | "empty" | "rows";

export type MembersToast = MemberAdminDone;

export type MembersScreenRow = {
  key: string;
  displayName: string;
  photoUrl: string | null;
  detail: string;
  value: string;
  isAdmin: boolean;
  press: () => void;
};

export type MembersScreenController = {
  goBack: () => void;
  listState: MembersListState;
  query: string;
  searchEmpty: boolean;
  activeRows: MembersScreenRow[];
  leftRows: MembersScreenRow[];
  canExpand: boolean;
  sheet: { name: string; member: Member } | null;
  today: string;
  lastAdmin: boolean;
  reachLine: string | null;
  toast: MembersToast | null;
  search: (typed: string) => void;
  expand: () => void;
  finish: (done: MemberAdminDone) => void;
  close: () => void;
  dismissToast: () => void;
};

export function useMembersScreen(): MembersScreenController {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<MembersToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: active } = useMembersQuery(supabase, "active");
  const { data: left } = useMembersQuery(supabase, "left");

  const close = useCallback(() => setOpenId(null), []);

  const finish = useCallback((done: MemberAdminDone) => {
    setToast(done);
    setOpenId(null);
  }, []);

  const rows = [...(active ?? []), ...(left ?? [])];
  const open = rows.find((row) => row.id === openId) ?? null;

  const reach = useMemo(() => {
    const suffixes = new Map<string, string | null>();
    const lines = new Map<string, string | null>();

    for (const row of active ?? []) {
      const state = getReachState({
        notificationsEnabled: row.notificationsEnabled,
        hasDevice: row.hasDevice,
        permission: PERMISSION_OF_OTHERS,
      });

      suffixes.set(row.id, getMemberListSuffix(state, true));
      lines.set(row.id, getMemberSheetLine(state, true));
    }

    return { suffixes, lines };
  }, [active]);

  const loading = active === undefined || left === undefined;
  const empty = !loading && active.length === 0 && left.length === 0;

  const searched = searchMembers(active ?? [], left ?? [], query);
  const searching = query.trim() !== "";
  const folded = searched.left.filter(
    (row) => row.leftAt !== null && isLeftOverAYear(row.leftAt, now),
  );
  const leftShown =
    searching || expanded
      ? searched.left
      : searched.left.filter((row) => !folded.includes(row));

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

  return {
    goBack,
    listState: loading ? "loading" : empty ? "empty" : "rows",
    query,
    searchEmpty: searched.isEmpty,
    activeRows: searched.active.map((row) => ({
      key: row.id,
      displayName: row.displayName ?? "",
      photoUrl: row.photoUrl,
      detail: [row.phone ?? "", reach.suffixes.get(row.id) ?? ""]
        .filter((part) => part !== "")
        .join(" "),
      value: "",
      isAdmin: row.role === "admin",
      press: () => setOpenId(row.id),
    })),
    leftRows: leftShown.map((row) => ({
      key: row.id,
      displayName: row.displayName ?? "",
      photoUrl: row.photoUrl,
      detail: "",
      value: row.leftAt === null ? "" : spellLeftAt(row.leftAt),
      isAdmin: false,
      press: () => setOpenId(row.id),
    })),
    canExpand: !searching && !expanded && folded.length > 0,
    sheet:
      open === null ? null : { name: open.displayName ?? "", member: open },
    today: now,
    lastAdmin: open === null ? false : isLastAdmin(active ?? [], open.id),
    reachLine: open === null ? null : (reach.lines.get(open.id) ?? null),
    toast,
    search: setQuery,
    expand: () => setExpanded(true),
    finish,
    close,
    dismissToast: () => setToast(null),
  };
}
