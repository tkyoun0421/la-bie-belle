import { DomainError } from "@/shared/api/errors";

/**
 * 조정과 임시공휴일 저장이 실패했을 때 시트가 할 일이다. 정본은
 * `docs/2-design/spec/payroll-adjust.md`의 상태 격자 「실패」다.
 *
 * **`not_allowed`는 그날 배정이 사라진 것이다.** 조정이 배정에 붙어서(PAY-002) 그 줄이 이미
 * 없는 목록이라, 문구를 띄우는 대신 다시 읽어 없어진 줄을 지운다.
 *
 * **나머지는 시트를 열어둔 채 한 줄을 띄운다.** 넣던 값이 남는 것은 화면이 입력을 안 지우는
 * 것이라 이 판정 밖이다.
 */

const NOT_ALLOWED = "not_allowed";

const SEND_FAILED = "보내지 못했어요. 다시 시도해주세요";

export type AdjustmentFailureAction = {
  refetch: boolean;
  message: string | null;
};

export function adjustmentFailureAction(
  error: unknown,
): AdjustmentFailureAction {
  if (error instanceof DomainError && error.code === NOT_ALLOWED) {
    return { refetch: true, message: null };
  }

  return { refetch: false, message: SEND_FAILED };
}
