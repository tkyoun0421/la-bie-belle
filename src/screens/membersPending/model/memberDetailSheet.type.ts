import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import type { SheetFace } from "@/screens/membersPending/model/membersPending.type";

export type MemberDetailSheetInput = {
  name: string;
  photoUrl: string | null;
  sentAt: string;
  values: ProfilePrivate | null;
  today: string;
  face: SheetFace;
  failed: boolean;
  onFace: (face: SheetFace) => void;
};

export type MemberDetailSheetValueRow = {
  label: string;
  value: string;
  numeric: boolean;
};

export type MemberDetailSheetAsk = {
  question: string;
  note: string;
  confirmLabel: string;
  destructive: boolean;
};

export type MemberDetailSheetController = {
  name: string;
  photoUrl: string | null;
  ask: MemberDetailSheetAsk | null;
  showMenu: boolean;
  menuOpen: boolean;
  toggleMenu: () => void;
  pressMenu: () => void;
  valueRows: MemberDetailSheetValueRow[];
  sentAt: string;
  failedLine: string | null;
};
