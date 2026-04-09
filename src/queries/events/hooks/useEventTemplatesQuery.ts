import { useQuery } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";
import { fetchEventTemplates } from "#/queries/events/services/fetchEventTemplates";

export function useEventTemplatesQuery() {
  return useQuery({
    queryKey: eventTemplateQueryKeys.collection(),
    queryFn: fetchEventTemplates,
  });
}
