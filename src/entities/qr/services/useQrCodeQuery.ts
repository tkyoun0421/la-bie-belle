import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getQrCode } from "@/entities/qr/api/getQrCode.api";
import { QR_CODE_STALE_TIME_MS } from "@/entities/qr/consts/qr.const";
import type { HallQrCode } from "@/entities/qr/model/qr.type";

/**
 * 관리자 QR 화면이 지금 코드를 읽는 자리다. 키는 `queryKeys` 팩토리가, `staleTime`은
 * `consts`가 든 값을 그대로 쓴다 — 무효화하는 쪽(`useRotateQrMutation`)과 읽는 쪽이 같은
 * 상수를 봐야 한 번의 돌리기로 그림이 바뀐다.
 */

export type QrCodeResult = {
  data: HallQrCode | null | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useQrCodeQuery(client: DB): QrCodeResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.hall.qr(),
    queryFn: () => getQrCode(client),
    staleTime: QR_CODE_STALE_TIME_MS,
  });

  return { data, error, isLoading };
}
