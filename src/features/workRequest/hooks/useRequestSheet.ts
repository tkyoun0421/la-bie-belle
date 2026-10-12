import { supabase } from "@/shared/api/supabase";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import type {
  RequestAnswer,
  SlotRequest,
} from "@/entities/workRequest/model/workRequest.type";
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
  const serverNowMs = useServerNow();

  const {
    mutate: answer,
    isPending,
    error,
  } = useRespondRequestMutation(supabase);

  const failed = answerFailure(error) === "unreachable";

  const answerWith = (picked: RequestAnswer) =>
    answer(
      { requestId: request.id, answer: picked },
      {
        onSuccess: onAnswered,
        onError: (thrown) => {
          if (answerFailure(thrown) === "seat_taken") {
            onSeatTaken(claimedLine(request));
          }
        },
      },
    );

  return {
    subtitle: requestSubtitle(request),
    ended:
      requestSheetState({
        closedAt: request.closedAt,
        expiresAt: request.expiresAt,
        serverNowMs,
      }) === "ended",
    sending: isPending,
    failedLine: failed ? WORK_REQUEST_COPY.sendFailed : null,
    accept: () => answerWith("accept"),
    decline: () => answerWith("decline"),
  };
}
