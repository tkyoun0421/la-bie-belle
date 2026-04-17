import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAssignmentAndCreateRequestAction } from "#/mutations/replacements/actions/cancelAssignmentAndCreateRequest";
import type { CancelAssignmentInput } from "#/mutations/replacements/schemas/cancelAssignment";
import { assignmentQueryKeys } from "#/queries/assignments/constants/assignmentQueryKeys";

export function useCancelAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelAssignmentInput) =>
      cancelAssignmentAndCreateRequestAction(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.all,
      });
    },
  });
}
