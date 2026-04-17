import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveReplacementAction } from "#/mutations/replacements/actions/approveReplacement";
import { replacementQueryKeys } from "#/queries/replacements/constants/replacementQueryKeys";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";
import { assignmentQueryKeys } from "#/queries/assignments/constants/assignmentQueryKeys";

export function useApproveReplacementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { replacementRequestId: string; userId: string }) => approveReplacementAction(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: replacementQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: [...replacementQueryKeys.all, data.requestId, "applications"],
      });
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: eventQueryKeys.all,
      });
    },
  });
}
