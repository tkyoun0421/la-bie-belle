export type ApprovalKind = "cancel";

export type ApprovalListRow = {
  id: string;
  kind: ApprovalKind;
  workDate: string;
};

export type ApprovalSheetFace = "detail" | "reject";
