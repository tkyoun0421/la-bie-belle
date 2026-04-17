import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyToReplacementAction } from "#/mutations/replacements/actions/applyToReplacement";
import { replacementQueryKeys } from "#/queries/replacements/constants/replacementQueryKeys";

export function useApplyToReplacementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { replacementRequestId: string }) => applyToReplacementAction(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: replacementQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: [...replacementQueryKeys.all, data.replacementRequestId, "applications"],
      });
    },
  });
}
