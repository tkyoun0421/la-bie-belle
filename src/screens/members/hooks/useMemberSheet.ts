import { useCallback, useMemo, useState } from "react";
import { openPhone } from "@/shared/lib/openPhone.lib";
import { canSaveDisplayName } from "@/entities/profile/model/canSaveDisplayName.policy";
import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import { MEMBER_SHEET_COPY } from "@/screens/members/consts/members.const";
import type {
  MemberSheetBody,
  MemberSheetController,
  MemberSheetFooter,
  MemberSheetInput,
  MemberSheetValueRow,
} from "@/screens/members/model/memberSheet.type";
import { spellLeftAt } from "@/screens/members/utils/spellLeftAt.utils";

export function useMemberSheet({
  member,
  today,
  lastAdmin,
  reachLine,
  face,
  draft,
  failed,
  onMarkLeave,
  onUndoLeave,
}: MemberSheetInput): MemberSheetController {
  const [menuOpen, setMenuOpen] = useState(false);

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

    if (left) {
      onUndoLeave();
      return;
    }

    onMarkLeave();
  }, [left, onMarkLeave, onUndoLeave]);

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
    toggleMenu,
    pressMenu,
    canSave: canSaveDisplayName(name, draft),
    roleLabel: admin ? MEMBER_SHEET_COPY.demote : MEMBER_SHEET_COPY.promote,
    roleDisabled: admin && lastAdmin,
  };
}
