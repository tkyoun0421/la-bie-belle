import type { Member } from "@/entities/member/model/member.type";
import type {
  MemberAdminDone,
  MemberDialogKind,
  MemberSheetFace,
} from "@/features/memberAdmin/model/memberAdmin.type";

export type MemberSheetInput = {
  member: Member;
  today: string;
  lastAdmin: boolean;
  reachLine: string | null;
  onDone: (done: MemberAdminDone) => void;
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
  draft: string;
  sending: boolean;
  canSave: boolean;
  roleLabel: string;
  roleDisabled: boolean;
  dialog: MemberDialogKind | null;
  toggleMenu: () => void;
  pressMenu: () => void;
  showFace: (face: MemberSheetFace) => void;
  writeDraft: (typed: string) => void;
  saveName: () => void;
  askRole: () => void;
  confirm: () => void;
  closeDialog: () => void;
};
