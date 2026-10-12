import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { MutationCallbacks } from "@/shared/model/mutationCallbacks.type";
import { updateMyContact } from "@/features/profileEdit/api/updateMyContact.api";

export type UpdateContactInput = {
  profileId: string;
  phone: string;
};

export type UpdateContactResult = {
  mutate: (input: UpdateContactInput, callbacks?: MutationCallbacks) => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
};

export function useUpdateContactMutation(client: DB): UpdateContactResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: ({ profileId, phone }: UpdateContactInput) =>
      updateMyContact(client, profileId, phone),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.private() }),
  });

  const save = useCallback(
    (input: UpdateContactInput, callbacks?: MutationCallbacks) => {
      if (!isPending) {
        mutate(input, callbacks);
      }
    },
    [isPending, mutate],
  );

  return { mutate: save, isPending, isSuccess, isError, error, reset };
}
