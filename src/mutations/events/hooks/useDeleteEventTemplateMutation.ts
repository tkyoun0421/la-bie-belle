import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/models/constants/eventTemplateQueryKeys";
import type { EventTemplate } from "#/queries/events/models/schemas/eventTemplate";
import { deleteEventTemplateAction } from "#/mutations/events/actions/deleteEventTemplate";
import type { DeleteEventTemplateInput } from "#/mutations/events/models/schemas/deleteEventTemplate";

export function useDeleteEventTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteEventTemplateInput) =>
      deleteEventTemplateAction(input),
    onSuccess(deletedTemplateId) {
      queryClient.setQueryData<EventTemplate[]>(
        eventTemplateQueryKeys.collection(),
        (currentTemplates = []) =>
          currentTemplates.filter(
            (template) => template.id !== deletedTemplateId
          )
      );
    },
  });
}
