import { queryOptions } from "@tanstack/react-query";
import { eventTemplateQueryKeys } from "#/queries/events/constants/eventTemplateQueryKeys";
import { fetchEventTemplates } from "#/queries/events/services/fetchEventTemplates";

export function getEventTemplateCollectionQueryOptions() {
  return queryOptions({
    queryKey: eventTemplateQueryKeys.collection(),
    queryFn: fetchEventTemplates,
  });
}
