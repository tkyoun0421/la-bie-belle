import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { submitProfile } from "@/features/profileEdit/api/submitProfile.api";
import type { SubmitProfileInput } from "@/features/profileEdit/model/profileEdit.type";

export type SubmitProfileResult = {
  mutate: (input: SubmitProfileInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useSubmitProfileMutation(client: DB): SubmitProfileResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (input: SubmitProfileInput) => submitProfile(client, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
  });

  const send = useCallback(
    (input: SubmitProfileInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: send, isPending, isSuccess, isError, error, reset };
}
