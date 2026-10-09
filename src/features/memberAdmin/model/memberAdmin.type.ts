import type { ToastKind } from "@/shared/ui/Toast";

export type MemberDialogKind =
  "promote" | "demote" | "leave" | "undo" | "blocked" | "last-admin";

export type MemberSheetFace = "detail" | "rename";

export type MemberDecision = "reject" | "block";

export type DetailSheetFace = "detail" | MemberDecision;

export type MemberAdminDone = { kind: ToastKind; message: string };
