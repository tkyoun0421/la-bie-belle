import type { Member } from "@/entities/member/model/member.type";
import type { MemberSheetFace } from "@/screens/members/model/members.type";

export type MemberSheetInput = {
  member: Member;
  today: string;
  lastAdmin: boolean;
  reachLine: string | null;
  face: MemberSheetFace;
  draft: string;
  failed: boolean;
  onMarkLeave: () => void;
  onUndoLeave: () => void;
};

export type MemberSheetValueRow = {
  label: string;
  value: string;
  numeric: boolean;
  press: (() => void) | null;
};

export type MemberSheetBody = "detail" | "rename" | "none";

export type MemberSheetFooter = "detail" | "rename" | "none";

export type MemberSheetController = {
  name: string;
  photoUrl: string | null;
  showAdminBadge: boolean;
  leftLine: string | null;
  erasedLine: string | null;
  failedLine: string | null;
  lastAdminNote: string | null;
  reachLine: string | null;
  body: MemberSheetBody;
  footer: MemberSheetFooter;
  valueRows: MemberSheetValueRow[];
  menuLabel: string | null;
  menuOpen: boolean;
  toggleMenu: () => void;
  pressMenu: () => void;
  canSave: boolean;
  roleLabel: string;
  roleDisabled: boolean;
};
