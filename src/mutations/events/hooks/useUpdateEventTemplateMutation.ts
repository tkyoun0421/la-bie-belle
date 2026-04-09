import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/models/constants/eventTemplateQueryKeys";
import type { EventTemplate } from "#/queries/events/models/schemas/eventTemplate";
import { updateEventTemplateAction } from "#/mutations/events/actions/updateEventTemplate";
import type { UpdateEventTemplateInput } from "#/mutations/events/models/schemas/updateEventTemplate";

export function useUpdateEventTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventTemplateInput) =>
      updateEventTemplateAction(input),
    onSuccess(template) {
      queryClient.setQueryData<EventTemplate[]>(
        eventTemplateQueryKeys.collection(),
        (currentTemplates = []) =>
          currentTemplates.map((currentTemplate) =>
            currentTemplate.id === template.id ? template : currentTemplate
          )
      );
    },
  });
}
