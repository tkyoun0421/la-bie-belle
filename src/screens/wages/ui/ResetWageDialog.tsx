import { Dialog } from "@/shared/ui/Dialog";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";

/**
 * 기본으로 되돌리기 전에 한 번 묻는 자리다. 지금 값이 기본보다 높으면 누르는 순간
 * 내려가므로 바뀔 값을 그 자리에서 말한다(wages.md 「기본으로 되돌리기」).
 *
 * **오른쪽 버튼이 destructive가 아니다.** 되돌린 뒤 다시 개별로 정할 수 있는 자리라 손을
 * 브랜드 밖으로 끌 이유가 없다.
 *
 * `notice`는 함수가 `no_default_wage`로 거절했을 때다. 화면이 기본 시급이 없는 동안
 * 되돌리기 줄을 안 그려서 평소엔 안 보이는 방어선이고, 그 판정은
 * [`model/wageError.policy.ts`](../model/wageError.policy.ts)가 한다.
 */

export type ResetWageDialogProps = {
  visible: boolean;
  body: string | undefined;
  notice: string | undefined;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetWageDialog({
  visible,
  body,
  notice,
  onClose,
  onConfirm,
}: ResetWageDialogProps) {
  return (
    <Dialog
      visible={visible}
      title={WAGES_COPY.resetTitle}
      notice={notice}
      closeLabel={WAGES_COPY.close}
      onClose={onClose}
      confirmLabel={WAGES_COPY.resetConfirm}
      onConfirm={onConfirm}
    >
      {body}
    </Dialog>
  );
}
