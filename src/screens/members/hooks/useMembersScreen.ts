import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import type { ToastKind } from "@/shared/ui/Toast";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import type { MemberRow } from "@/entities/member/api/member.dto";
import { isLastAdmin } from "@/entities/member/model/isLastAdmin.policy";
import { isLeftOverAYear } from "@/entities/member/model/sortMembers.policy";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { searchMembers } from "@/entities/member/utils/searchMembers.utils";
import { PERMISSION_OF_OTHERS } from "@/entities/notification/consts/notification.const";
import { getReachState } from "@/entities/notification/model/reachState.policy";
import {
  getMemberListSuffix,
  getMemberSheetLine,
} from "@/entities/notification/utils/reachMessage.utils";
import { useMarkLeaveMutation } from "@/features/memberAdmin/services/useMarkLeaveMutation";
import { useSetDisplayNameMutation } from "@/features/memberAdmin/services/useSetDisplayNameMutation";
import { useSetRoleMutation } from "@/features/memberAdmin/services/useSetRoleMutation";
import { useUndoLeaveMutation } from "@/features/memberAdmin/services/useUndoLeaveMutation";
import { MEMBERS_COPY } from "@/screens/members/consts/members.const";
import type {
  MemberDialogKind,
  MemberSheetFace,
} from "@/screens/members/model/members.type";
import { isUnexpectedWriteError } from "@/screens/members/model/writeError.policy";
import { spellLeftAt } from "@/screens/members/utils/spellLeftAt.utils";

export type MembersListState = "loading" | "empty" | "rows";

export type MembersToast = { kind: ToastKind; message: string };

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
  listState: MembersListState;
  query: string;
  searchEmpty: boolean;
  activeRows: MembersScreenRow[];
  leftRows: MembersScreenRow[];
  canExpand: boolean;
  sheet: { name: string; member: MemberRow } | null;
  today: string;
  lastAdmin: boolean;
  reachLine: string | null;
  face: MemberSheetFace;
  draft: string;
  sending: boolean;
  failed: boolean;
  dialog: MemberDialogKind | null;
  toast: MembersToast | null;
  search: (typed: string) => void;
  expand: () => void;
  showFace: (next: MemberSheetFace) => void;
  writeDraft: (typed: string) => void;
  saveName: () => void;
  askRole: () => void;
  askLeave: () => void;
  askUndo: () => void;
  confirm: () => void;
  closeDialog: () => void;
  close: () => void;
  dismissToast: () => void;
};

export function useMembersScreen(): MembersScreenController {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<MemberSheetFace>("detail");
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<MemberDialogKind | null>(null);
  const [toast, setToast] = useState<MembersToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: active } = useMembersQuery(supabase, "active");
  const { data: left } = useMembersQuery(supabase, "left");

  const {
    mutate: saveDisplayName,
    isPending: savingName,
    isSuccess: nameSaved,
    error: nameError,
    reset: resetName,
  } = useSetDisplayNameMutation(supabase);

  const {
    mutate: saveRole,
    isSuccess: roleSaved,
    error: roleError,
    reset: resetRole,
  } = useSetRoleMutation(supabase);

  const {
    mutate: sendLeave,
    isSuccess: leaveDone,
    error: leaveError,
    reset: resetLeave,
  } = useMarkLeaveMutation(supabase);

  const {
    mutate: sendUndo,
    isSuccess: undoDone,
    error: undoError,
    reset: resetUndo,
  } = useUndoLeaveMutation(supabase);

  const close = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    setDraft("");
    setAsked(null);
    resetName();
    resetRole();
    resetLeave();
    resetUndo();
  }, [resetName, resetRole, resetLeave, resetUndo]);

  const finish = useCallback(
    (toasted: MembersToast) => {
      setToast(toasted);
      close();
    },
    [close],
  );

  useEffect(() => {
    if (nameSaved) {
      finish({ kind: "success", message: MEMBERS_COPY.nameChanged });
    }
  }, [nameSaved, finish]);

  useEffect(() => {
    if (roleSaved) {
      finish({
        kind: "success",
        message:
          asked === "demote" ? MEMBERS_COPY.demoted : MEMBERS_COPY.promoted,
      });
    }
  }, [roleSaved, asked, finish]);

  useEffect(() => {
    if (leaveDone) {
      finish({ kind: "success", message: MEMBERS_COPY.leaveDone });
    }
  }, [leaveDone, finish]);

  useEffect(() => {
    if (undoDone) {
      finish({ kind: "success", message: MEMBERS_COPY.undoDone });
    }
  }, [undoDone, finish]);

  const leaveCode = errorCodeOf(leaveError);
  const undoCode = errorCodeOf(undoError);

  useEffect(() => {
    if (leaveCode === "already_decided" || undoCode === "already_decided") {
      finish({ kind: "info", message: MEMBERS_COPY.alreadyDecided });
    }
  }, [leaveCode, undoCode, finish]);

  const rows = [...(active ?? []), ...(left ?? [])];
  const open = rows.find((row) => row.id === openId) ?? null;

  const reach = useMemo(() => {
    const suffixes = new Map<string, string | null>();
    const lines = new Map<string, string | null>();

    for (const row of active ?? []) {
      const state = getReachState({
        notificationsEnabled: row.notifications_enabled,
        hasDevice: row.has_device,
        permission: PERMISSION_OF_OTHERS,
      });

      suffixes.set(row.id, getMemberListSuffix(state, true));
      lines.set(row.id, getMemberSheetLine(state, true));
    }

    return { suffixes, lines };
  }, [active]);

  const refused: MemberDialogKind | null =
    leaveCode === "has_future_assignments"
      ? "blocked"
      : leaveCode === "last_admin" || errorCodeOf(roleError) === "last_admin"
        ? "last-admin"
        : null;

  const loading = active === undefined || left === undefined;
  const empty = !loading && active.length === 0 && left.length === 0;

  const searched = searchMembers(active ?? [], left ?? [], query);
  const searching = query.trim() !== "";
  const folded = searched.left.filter(
    (row) => row.left_at !== null && isLeftOverAYear(row.left_at, now),
  );
  const leftShown =
    searching || expanded
      ? searched.left
      : searched.left.filter((row) => !folded.includes(row));

  const openSheet = (row: MemberRow) => {
    setOpenId(row.id);
    setFace("detail");
    setDraft(row.display_name ?? "");
    setAsked(null);
  };

  return {
    listState: loading ? "loading" : empty ? "empty" : "rows",
    query,
    searchEmpty: searched.isEmpty,
    activeRows: searched.active.map((row) => ({
      key: row.id,
      displayName: row.display_name ?? "",
      photoUrl: row.photo_url,
      detail: [row.phone ?? "", reach.suffixes.get(row.id) ?? ""]
        .filter((part) => part !== "")
        .join(" "),
      value: "",
      isAdmin: row.role === "admin",
      press: () => openSheet(row),
    })),
    leftRows: leftShown.map((row) => ({
      key: row.id,
      displayName: row.display_name ?? "",
      photoUrl: row.photo_url,
      detail: "",
      value: row.left_at === null ? "" : spellLeftAt(row.left_at),
      isAdmin: false,
      press: () => openSheet(row),
    })),
    canExpand: !searching && !expanded && folded.length > 0,
    sheet:
      open === null ? null : { name: open.display_name ?? "", member: open },
    today: now,
    lastAdmin: open === null ? false : isLastAdmin(active ?? [], open.id),
    reachLine: open === null ? null : (reach.lines.get(open.id) ?? null),
    face,
    draft,
    sending: savingName,
    failed: [nameError, roleError, leaveError, undoError].some(
      isUnexpectedWriteError,
    ),
    dialog: refused ?? asked,
    toast,
    search: setQuery,
    expand: () => setExpanded(true),
    showFace: (next) => {
      if (next === "rename") {
        setDraft(open?.display_name ?? "");
      }
      setFace(next);
    },
    writeDraft: setDraft,
    saveName: () => {
      if (open !== null) {
        saveDisplayName({ profileId: open.id, name: draft });
      }
    },
    askRole: () => setAsked(open?.role === "admin" ? "demote" : "promote"),
    askLeave: () => setAsked("leave"),
    askUndo: () => setAsked("undo"),
    confirm: () => {
      if (open === null) {
        return;
      }

      if (asked === "promote" || asked === "demote") {
        saveRole({
          profileId: open.id,
          role: asked === "promote" ? "admin" : "member",
        });
        return;
      }

      if (asked === "leave") {
        sendLeave({ profileId: open.id });
        return;
      }

      if (asked === "undo") {
        sendUndo({ profileId: open.id });
      }
    },
    closeDialog: () => {
      setAsked(null);
      resetRole();
      resetLeave();
    },
    close,
    dismissToast: () => setToast(null),
  };
}
