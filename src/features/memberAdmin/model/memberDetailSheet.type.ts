import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import type {
  DetailSheetFace,
  MemberAdminDone,
} from "@/features/memberAdmin/model/memberAdmin.type";

export type MemberDetailSheetInput = {
  profileId: string;
  name: string;
  photoUrl: string | null;
  sentAt: string;
  values: ProfilePrivate | null;
  today: string;
  onDone: (done: MemberAdminDone) => void;
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
  sending: boolean;
  toggleMenu: () => void;
  pressMenu: () => void;
  showFace: (face: DetailSheetFace) => void;
  approve: () => void;
  confirm: () => void;
  valueRows: MemberDetailSheetValueRow[];
  sentAt: string;
  failedLine: string | null;
};
