import { useCallback, useMemo, useState } from "react";
import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import {
  CONFIRM_COPY,
  SHEET_COPY,
} from "@/screens/membersPending/consts/membersPending.const";
import type {
  MemberDetailSheetAsk,
  MemberDetailSheetController,
  MemberDetailSheetInput,
  MemberDetailSheetValueRow,
} from "@/screens/membersPending/model/memberDetailSheet.type";

export function useMemberDetailSheet({
  name,
  photoUrl,
  sentAt,
  values,
  today,
  face,
  failed,
  onFace,
}: MemberDetailSheetInput): MemberDetailSheetController {
  const [menuOpen, setMenuOpen] = useState(false);

  const ask = useMemo<MemberDetailSheetAsk | null>(() => {
    if (face === "detail") {
      return null;
    }

    const asked = CONFIRM_COPY[face];

    return {
      question: `${name}${asked.questionSuffix}`,
      note: asked.note,
      confirmLabel: asked.action,
      destructive: face === "block",
    };
  }, [face, name]);

  const valueRows = useMemo<MemberDetailSheetValueRow[]>(() => {
    if (ask !== null) {
      return [];
    }

    return [
      {
        label: SHEET_COPY.genderLabel,
        value: values === null ? "" : spellGender(values.gender),
        numeric: false,
      },
      {
        label: SHEET_COPY.birthLabel,
        value: values?.birthDate
          ? formatBirthDate(values.birthDate, today)
          : "",
        numeric: true,
      },
      {
        label: SHEET_COPY.phoneLabel,
        value: values?.phone ?? "",
        numeric: true,
      },
      {
        label: SHEET_COPY.emailLabel,
        value: values?.email ?? "",
        numeric: false,
      },
    ];
  }, [ask, values, today]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  const pressMenu = useCallback(() => {
    setMenuOpen(false);
    onFace("block");
  }, [onFace]);

  return {
    name,
    photoUrl,
    ask,
    showMenu: ask === null,
    menuOpen,
    toggleMenu,
    pressMenu,
    valueRows,
    sentAt,
    failedLine: failed ? SHEET_COPY.sendFailed : null,
  };
}
