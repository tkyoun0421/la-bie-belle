import { MEMBER_SHEET_COPY } from "@/features/memberAdmin/consts/memberAdmin.const";
import type {
  MemberSheetBody,
  MemberSheetFooter,
} from "@/features/memberAdmin/model/memberSheet.type";

type MemberSheetStanding = {
  renaming: boolean;
  erased: boolean;
  left: boolean;
};

type MemberSheetVisuals = {
  body: MemberSheetBody;
  footer: MemberSheetFooter;
  menuLabel: string | null;
};

export function memberSheetVisuals({
  renaming,
  erased,
  left,
}: MemberSheetStanding): MemberSheetVisuals {
  if (renaming) {
    return { body: "rename", footer: "rename", menuLabel: null };
  }

  const footer: MemberSheetFooter = left ? "none" : "detail";

  if (erased) {
    return { body: "none", footer, menuLabel: null };
  }

  return {
    body: "detail",
    footer,
    menuLabel: left ? MEMBER_SHEET_COPY.undoLeave : MEMBER_SHEET_COPY.markLeave,
  };
}
