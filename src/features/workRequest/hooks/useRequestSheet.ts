import { useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";
import { WORK_REQUEST_COPY } from "@/features/workRequest/consts/workRequest.const";
import { answerFailure } from "@/features/workRequest/model/answerFailure.policy";
import { requestSheetState } from "@/features/workRequest/model/requestSheet.policy";
import { useRespondRequestMutation } from "@/features/workRequest/services/useRespondRequestMutation";
import {
  claimedLine,
  requestSubtitle,
} from "@/features/workRequest/utils/requestCopy.utils";

export type RequestSheetInput = {
  request: SlotRequest;
  onAnswered: () => void;
  onSeatTaken: (line: string) => void;
};

export type RequestSheetController = {
  subtitle: string;
  ended: boolean;
  sending: boolean;
  failedLine: string | null;
  accept: () => void;
  decline: () => void;
};

export function useRequestSheet({
  request,
  onAnswered,
  onSeatTaken,
}: RequestSheetInput): RequestSheetController {
  const clockOffset = serverClockStore((at) => at.offset);

  const {
    mutate: answer,
    isPending,
    isSuccess,
    error,
  } = useRespondRequestMutation(supabase);

  const failure = answerFailure(error);
  const failed = failure === "unreachable";

  useEffect(() => {
    if (isSuccess) {
      onAnswered();
    }
  }, [isSuccess, onAnswered]);

  useEffect(() => {
    if (failure === "seat_taken") {
      onSeatTaken(claimedLine(request));
    }
  }, [failure, request, onSeatTaken]);

  return {
    subtitle: requestSubtitle(request),
    ended:
      requestSheetState({
        closedAt: request.closedAt,
        expiresAt: request.expiresAt,
        serverNowMs: nowWithOffset(Date.now(), clockOffset),
      }) === "ended",
    sending: isPending,
    failedLine: failed ? WORK_REQUEST_COPY.sendFailed : null,
    accept: () => answer({ requestId: request.id, answer: "accept" }),
    decline: () => answer({ requestId: request.id, answer: "decline" }),
  };
}
