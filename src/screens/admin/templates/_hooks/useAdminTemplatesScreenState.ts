import { useEventTemplateCollectionState } from "#/queries/events/hooks/useEventTemplateCollectionState";
import { readTemplateListErrorMessage } from "#/screens/admin/templates/_helpers/templateError";

type UseAdminTemplatesScreenStateOptions = {
  initialHighlightedTemplateId: string | null;
};

export function useAdminTemplatesScreenState({
  initialHighlightedTemplateId,
}: UseAdminTemplatesScreenStateOptions) {
  const {
    filteredTemplates,
    highlightedTemplateId,
    searchTerm,
    setHighlightedTemplateId,
    setSearchTerm,
    templatesQuery,
  } = useEventTemplateCollectionState(initialHighlightedTemplateId);
  const queryError = templatesQuery.error
    ? readTemplateListErrorMessage(templatesQuery.error)
    : null;

  function clearHighlightedTemplate() {
    setHighlightedTemplateId(null);
  }

  return {
    clearHighlightedTemplate,
    filteredTemplates,
    highlightedTemplateId,
    onSearchTermChange: setSearchTerm,
    queryError,
    searchTerm,
  };
}
