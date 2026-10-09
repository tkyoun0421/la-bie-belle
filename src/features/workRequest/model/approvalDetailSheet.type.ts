import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";
import type { CancelApprovalDetail } from "@/entities/workRequest/utils/approvalDetail.utils";

export type ApprovalSheetFace = "detail" | "reject";

export type ApprovalDetailSheetInput = {
  approval: PendingApproval;
  onRejected: () => void;
  onApproved: () => void;
};

export type ApprovalDetailSheetController = {
  detail: CancelApprovalDetail;
  face: ApprovalSheetFace;
  sending: boolean;
  failed: boolean;
  chosen: string | null;
  written: string;
  canSend: boolean;
  sendLabel: string;
  confirming: boolean;
  confirmBody: string;
  confirmLabel: string;
  confirmNotice: string | undefined;
  showFace: (face: ApprovalSheetFace) => void;
  choose: (value: string) => void;
  write: (text: string) => void;
  reject: () => void;
  askApprove: () => void;
  cancelApprove: () => void;
  approve: () => void;
};
