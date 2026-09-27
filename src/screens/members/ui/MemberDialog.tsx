import { Dialog } from "@/shared/ui/Dialog";

/**
 * 직원 화면이 묻고 막는 자리 여섯이다. 문안의 정본은
 * `docs/2-design/modules/account/screens/members.md`의 문안 표 셋이고 여기는 그 표를 옮겨
 * 적은 자리다 — 한 벌로 모아두면 어느 물음이 어느 답을 받는지가 한눈에 보인다.
 *
 * **묻는 넷과 막는 둘이 갈린다.** 역할·퇴사·되돌리기는 동의를 받는 자리라 버튼이 둘이고,
 * 배정이 남았거나 마지막 관리자라 못 하는 자리는 그 사실을 말하는 것뿐이라 버튼이 하나다.
 *
 * **오른쪽 버튼이 destructive가 아니다.** 퇴사도 역할 바꾸기도 되돌릴 수 있는 자리라 손을
 * 브랜드로 끌 이유가 없다(members.md의 「색」).
 */

export const MARK_LEAVE_CONFIRM_TEST_ID = "members-mark-leave-confirm";

export type MemberDialogKind =
  "promote" | "demote" | "leave" | "undo" | "blocked" | "last-admin";

type DialogCopy = {
  title?: string;
  body: string;
  close: string | null;
  confirm: string;
  confirmTestID?: string;
};

const COPY: Record<MemberDialogKind, DialogCopy> = {
  promote: {
    title: "관리자로 올릴까요?",
    body: "근무표와 급여와 다른 사람의 프로필을 모두 볼 수 있게 돼요",
    close: "닫기",
    confirm: "올리기",
  },
  demote: {
    title: "관리자에서 내릴까요?",
    body: "관리자 화면에 못 들어가고 자기 근무만 보게 돼요",
    close: "닫기",
    confirm: "내리기",
  },
  leave: {
    title: "퇴사 처리할까요?",
    body: "근무표와 근무 신청이 닫히고 지난 급여만 볼 수 있어요",
    close: "닫기",
    confirm: "퇴사 처리",
    confirmTestID: MARK_LEAVE_CONFIRM_TEST_ID,
  },
  undo: {
    title: "퇴사를 되돌릴까요?",
    body: "다시 근무표에 배정할 수 있게 돼요",
    close: "닫기",
    confirm: "되돌리기",
  },
  blocked: {
    title: "앞으로 배정된 근무가 남아 있어요",
    body: "근무표에서 이 자리를 비우고 다시 눌러 주세요",
    close: null,
    confirm: "근무표로 가기",
  },
  "last-admin": {
    body: "관리자가 한 명뿐이라 내릴 수 없어요",
    close: null,
    confirm: "닫기",
  },
};

export type MemberDialogProps = {
  kind: MemberDialogKind | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function MemberDialog({ kind, onClose, onConfirm }: MemberDialogProps) {
  if (kind === null) {
    return null;
  }

  const copy = COPY[kind];

  return (
    <Dialog
      visible
      title={copy.title}
      closeLabel={copy.close}
      onClose={onClose}
      confirmLabel={copy.confirm}
      confirmTestID={copy.confirmTestID}
      onConfirm={copy.close === null ? onClose : onConfirm}
    >
      {copy.body}
    </Dialog>
  );
}
