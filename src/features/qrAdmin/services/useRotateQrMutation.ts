import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { rotateQr } from "@/features/qrAdmin/api/rotateQr.api";

export type RotateQrResult = {
  mutate: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useRotateQrMutation(client: DB): RotateQrResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: () => rotateQr(client),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.hall.qr() }),
  });

  const send = useCallback(() => {
    if (!isPending) {
      mutate();
    }
  }, [isPending, mutate]);

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
