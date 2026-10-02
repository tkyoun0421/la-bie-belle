import { useCallback, useEffect, useMemo, useState } from "react";
import type { DB } from "@/shared/api/database";
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

/**
 * 관리자가 이미 받은 사람들을 다루는 화면의 controller다. 정본은
 * `docs/2-design/modules/account/screens/members.md`고 완료 조건은
 * `docs/2-design/spec/members.md`다.
 *
 * **쓰기 넷이 한 시트에서 나간다.** 이름·역할·퇴사·되돌리기가 같은 사람을 보고, 성공하면
 * 넷 다 시트를 닫고 토스트를 세운다 — 말만 다르다. 그래서 열림이 통신에 매여 있고 화면 것이
 * 아니다.
 *
 * **막는 자리 둘은 서버가 정한다.** 화면이 마지막 관리자의 내리기를 미리 잠그는 것은 목록을
 * 받은 시점의 판정이고, 누르는 시점의 판정은 `last_admin`과 `has_future_assignments`로
 * 돌아와 Dialog가 이유를 말한다 — 「물어서 선 Dialog」와 「거절당해 선 Dialog」가 한 자리에
 * 합쳐지는 까닭이다.
 *
 * **퇴사한 사람이 같은 화면 아래에 있다.** 검색은 두 구획을 같이 거르고, 1년이 지난 사람은
 * 접혀 있다 — 찾는 중이거나 펴 뒀으면 다 보인다.
 *
 * **서버 시계를 쓴다.** 1년이 지났는지와 생일이 지났는지가 둘 다 「지금」에 달려 있다.
 *
 * **보낼 데는 안 든다.** 뒤로와 전화 걸기는 `.tsx`가 쥔다.
 */

export type MembersListState = "loading" | "empty" | "rows";

export type MembersToast = { kind: ToastKind; message: string };

/** 목록 한 줄이다 — 재직과 퇴사가 쓰는 칸이 갈려 둘 다 선택이다. */
export type MembersScreenRow = {
  key: string;
  displayName: string;
  photoUrl: string | null;
  /** 재직 줄의 연락처와 알림 한 마디다. 퇴사 줄에는 없다. */
  detail: string;
  /** 퇴사 줄의 퇴사한 날이다. 재직 줄에는 없다. */
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

export function useMembersScreen(client: DB): MembersScreenController {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<MemberSheetFace>("detail");
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<MemberDialogKind | null>(null);
  const [toast, setToast] = useState<MembersToast | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();

  const { data: active } = useMembersQuery(client, "active");
  const { data: left } = useMembersQuery(client, "left");

  const {
    mutate: saveDisplayName,
    isPending: savingName,
    isSuccess: nameSaved,
    error: nameError,
    reset: resetName,
  } = useSetDisplayNameMutation(client);

  const {
    mutate: saveRole,
    isSuccess: roleSaved,
    error: roleError,
    reset: resetRole,
  } = useSetRoleMutation(client);

  const {
    mutate: sendLeave,
    isSuccess: leaveDone,
    error: leaveError,
    reset: resetLeave,
  } = useMarkLeaveMutation(client);

  const {
    mutate: sendUndo,
    isSuccess: undoDone,
    error: undoError,
    reset: resetUndo,
  } = useUndoLeaveMutation(client);

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

  /**
   * 갈래는 재직자에게만 붙는다 — 퇴사 구획은 이 표에 아예 안 든다. 남의 기기 권한은 알
   * 길이 없어 판정 축이 의사와 기기 둘뿐이다(`reachState.policy.ts`).
   */
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
