import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import { readTemplateListErrorMessage } from "#/screens/admin/templates/_helpers/templateError";

export function useAdminTemplatesScreenState() {
  const {
    filteredTemplates,
    searchTerm,
    setSearchTerm,
    templatesQuery,
  } = useEventTemplateCollectionState();
  const queryError = templatesQuery.error
    ? readTemplateListErrorMessage(templatesQuery.error)
    : null;

  return {
    filteredTemplates,
    onSearchTermChange: setSearchTerm,
    queryError,
    searchTerm,
  };
}
