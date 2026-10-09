import { useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { isValidCancelReason } from "@/features/workRequest/model/cancelReason.policy";
import { useCreateCancelRequestMutation } from "@/features/workRequest/services/useCreateCancelRequestMutation";
import { cancelSheetTitle } from "@/features/workRequest/utils/requestCopy.utils";

export type CancelShiftSheetInput = {
  assignmentId: string;
  workDate: string;
  position: string;
  onSent: () => void;
};

export type CancelShiftSheetController = {
  title: string;
  reason: string;
  canSend: boolean;
  sending: boolean;
  failed: boolean;
  writeReason: (typed: string) => void;
  send: () => void;
};

export function useCancelShiftSheet({
  assignmentId,
  workDate,
  position,
  onSent,
}: CancelShiftSheetInput): CancelShiftSheetController {
  const [reason, setReason] = useState("");

  const {
    mutate: send,
    isPending,
    isSuccess,
    isError,
  } = useCreateCancelRequestMutation(supabase);

  const canSend = isValidCancelReason(reason);

  useEffect(() => {
    if (isSuccess) {
      onSent();
    }
  }, [isSuccess, onSent]);

  return {
    title: cancelSheetTitle(workDate, position),
    reason,
    canSend,
    sending: isPending,
    failed: isError,
    writeReason: setReason,
    send: () => {
      if (canSend) {
        send({ assignmentId, reason: reason.trim() });
      }
    },
  };
}
