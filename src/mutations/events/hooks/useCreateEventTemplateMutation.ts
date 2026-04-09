import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/models/constants/eventTemplateQueryKeys";
import type { EventTemplate } from "#/queries/events/models/schemas/eventTemplate";
import { createEventTemplateAction } from "#/mutations/events/actions/createEventTemplate";
import type { CreateEventTemplateInput } from "#/mutations/events/models/schemas/createEventTemplate";

export function useCreateEventTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventTemplateInput) =>
      createEventTemplateAction(input),
    onSuccess(template) {
      queryClient.setQueryData<EventTemplate[]>(
        eventTemplateQueryKeys.collection(),
        (currentTemplates = []) => [template, ...currentTemplates]
      );
    },
  });
}
