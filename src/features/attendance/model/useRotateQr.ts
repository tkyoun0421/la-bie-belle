import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Db } from "@/shared/api/database";
import { qrCodeKey } from "@/entities/attendance/dals/get-qr-code";
import { rotateQr } from "@/entities/attendance/dals/rotate-qr";

/**
 * 관리자가 「새로 뽑기」를 눌렀을 때다. 옛 코드는 그 자리에서 죽는다
 * (`docs/2-design/modules/attendance/design.md`의 「QR 바꾸기」).
 *
 * **낡는 것은 `['hall','qr']` 하나다.** 홀 기본값도 근무표도 안 움직인다.
 *
 * **보내는 동안은 다시 안 보낸다.** 두 번 누르면 코드를 두 번 갈아, 관리자가 방금 인쇄한
 * 종이가 자기 손으로 죽는다.
 */

export type RotateQrResult = {
  mutate: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRotateQr(client: Db): RotateQrResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: () => rotateQr(client),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qrCodeKey() }),
  });

  const send = useCallback(() => {
    if (!isPending) {
      mutate();
    }
  }, [isPending, mutate]);

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
