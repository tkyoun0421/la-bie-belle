import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { openPhone } from "@/shared/lib/openPhone.lib";
import { errorCodeOf } from "@/shared/model/errorCode.policy";
import { spellLeftAt } from "@/entities/member/utils/spellLeftAt.utils";
import { canSaveDisplayName } from "@/entities/profile/model/canSaveDisplayName.policy";
import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import {
  MEMBER_SHEET_COPY,
  MEMBER_SHEET_TOAST,
} from "@/features/memberAdmin/consts/memberAdmin.const";
import type {
  MemberDialogKind,
  MemberSheetFace,
} from "@/features/memberAdmin/model/memberAdmin.type";
import type {
  MemberSheetBody,
  MemberSheetController,
  MemberSheetFooter,
  MemberSheetInput,
  MemberSheetValueRow,
} from "@/features/memberAdmin/model/memberSheet.type";
import { isUnexpectedWriteError } from "@/features/memberAdmin/model/writeError.policy";
import { useMarkLeaveMutation } from "@/features/memberAdmin/services/useMarkLeaveMutation";
import { useSetDisplayNameMutation } from "@/features/memberAdmin/services/useSetDisplayNameMutation";
import { useSetRoleMutation } from "@/features/memberAdmin/services/useSetRoleMutation";
import { useUndoLeaveMutation } from "@/features/memberAdmin/services/useUndoLeaveMutation";

export function useMemberSheet({
  member,
  today,
  lastAdmin,
  reachLine,
  onDone,
}: MemberSheetInput): MemberSheetController {
  const [menuOpen, setMenuOpen] = useState(false);
  const [face, setFace] = useState<MemberSheetFace>("detail");
  const [draft, setDraft] = useState(member.displayName ?? "");
  const [asked, setAsked] = useState<MemberDialogKind | null>(null);

  const {
    mutate: saveDisplayName,
    isPending: savingName,
    isSuccess: nameSaved,
    error: nameError,
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
  } = useUndoLeaveMutation(supabase);

  useEffect(() => {
    if (nameSaved) {
      onDone({ kind: "success", message: MEMBER_SHEET_TOAST.nameChanged });
    }
  }, [nameSaved, onDone]);

  useEffect(() => {
    if (roleSaved) {
      onDone({
        kind: "success",
        message:
          asked === "demote"
            ? MEMBER_SHEET_TOAST.demoted
            : MEMBER_SHEET_TOAST.promoted,
      });
    }
  }, [roleSaved, asked, onDone]);

  useEffect(() => {
    if (leaveDone) {
      onDone({ kind: "success", message: MEMBER_SHEET_TOAST.leaveDone });
    }
  }, [leaveDone, onDone]);

  useEffect(() => {
    if (undoDone) {
      onDone({ kind: "success", message: MEMBER_SHEET_TOAST.undoDone });
    }
  }, [undoDone, onDone]);

  const leaveCode = errorCodeOf(leaveError);
  const undoCode = errorCodeOf(undoError);

  useEffect(() => {
    if (leaveCode === "already_decided" || undoCode === "already_decided") {
      onDone({ kind: "info", message: MEMBER_SHEET_TOAST.alreadyDecided });
    }
  }, [leaveCode, undoCode, onDone]);

  const name = member.displayName ?? "";
  const left = member.leftAt !== null;
  const erased = member.erasedAt !== null;
  const admin = member.role === "admin";
  const renaming = face === "rename";
  const phone = member.phone;

  const body: MemberSheetBody = renaming
    ? "rename"
    : erased
      ? "none"
      : "detail";

  const footer: MemberSheetFooter = renaming
    ? "rename"
    : left
      ? "none"
      : "detail";

  const valueRows = useMemo<MemberSheetValueRow[]>(() => {
    if (body !== "detail") {
      return [];
    }

    return [
      {
        label: MEMBER_SHEET_COPY.phoneLabel,
        value: phone ?? "",
        numeric: true,
        press: phone ? () => openPhone(phone) : null,
      },
      {
        label: MEMBER_SHEET_COPY.genderLabel,
        value: spellGender(member.gender),
        numeric: false,
        press: null,
      },
      {
        label: MEMBER_SHEET_COPY.birthLabel,
        value: member.birthDate ? formatBirthDate(member.birthDate, today) : "",
        numeric: true,
        press: null,
      },
    ];
  }, [body, phone, member.gender, member.birthDate, today]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  const pressMenu = useCallback(() => {
    setMenuOpen(false);
    setAsked(left ? "undo" : "leave");
  }, [left]);

  const showFace = useCallback(
    (next: MemberSheetFace) => {
      if (next === "rename") {
        setDraft(member.displayName ?? "");
      }

      setFace(next);
    },
    [member.displayName],
  );

  const saveName = useCallback(() => {
    saveDisplayName({ profileId: member.id, name: draft });
  }, [saveDisplayName, member.id, draft]);

  const confirm = useCallback(() => {
    if (asked === "promote" || asked === "demote") {
      saveRole({
        profileId: member.id,
        role: asked === "promote" ? "admin" : "member",
      });
      return;
    }

    if (asked === "leave") {
      sendLeave({ profileId: member.id });
      return;
    }

    if (asked === "undo") {
      sendUndo({ profileId: member.id });
    }
  }, [asked, member.id, saveRole, sendLeave, sendUndo]);

  const askRole = useCallback(() => {
    setAsked(admin ? "demote" : "promote");
  }, [admin]);

  const closeDialog = useCallback(() => {
    setAsked(null);
    resetRole();
    resetLeave();
  }, [resetRole, resetLeave]);

  const refused: MemberDialogKind | null =
    leaveCode === "has_future_assignments"
      ? "blocked"
      : leaveCode === "last_admin" || errorCodeOf(roleError) === "last_admin"
        ? "last-admin"
        : null;

  const failed = [nameError, roleError, leaveError, undoError].some(
    isUnexpectedWriteError,
  );

  return {
    name,
    photoUrl: member.photoUrl,
    showAdminBadge: admin,
    leftLine:
      left && member.leftAt
        ? `${spellLeftAt(member.leftAt)}${MEMBER_SHEET_COPY.leftSuffix}`
        : null,
    erasedLine: erased ? MEMBER_SHEET_COPY.erased : null,
    failedLine: failed ? MEMBER_SHEET_COPY.sendFailed : null,
    lastAdminNote: admin && lastAdmin ? MEMBER_SHEET_COPY.lastAdminNote : null,
    reachLine: body === "detail" ? reachLine : null,
    body,
    footer,
    valueRows,
    menuLabel:
      renaming || erased
        ? null
        : left
          ? MEMBER_SHEET_COPY.undoLeave
          : MEMBER_SHEET_COPY.markLeave,
    menuOpen,
    draft,
    sending: savingName,
    canSave: canSaveDisplayName(name, draft),
    roleLabel: admin ? MEMBER_SHEET_COPY.demote : MEMBER_SHEET_COPY.promote,
    roleDisabled: admin && lastAdmin,
    dialog: refused ?? asked,
    toggleMenu,
    pressMenu,
    showFace,
    writeDraft: setDraft,
    saveName,
    askRole,
    confirm,
    closeDialog,
  };
}
