import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getQrCode } from "@/entities/qr/api/getQrCode.api";
import { QR_CODE_STALE_TIME_MS } from "@/entities/qr/consts/qr.const";
import type { HallQrCode } from "@/entities/qr/model/qr.type";

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
