"use client";

import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import { EventTemplatesListPanel } from "#/screens/admin/templates/_components/EventTemplatesListPanel";
import { useAdminTemplatesScreenState } from "#/screens/admin/templates/_hooks/useAdminTemplatesScreenState";

type AdminTemplatesClientProps = {
  initialHighlightedTemplateId: string | null;
};

export function AdminTemplatesClient({
  initialHighlightedTemplateId,
}: Readonly<AdminTemplatesClientProps>) {
  const {
    deletePending,
    filteredTemplates,
    highlightedTemplateId,
    listError,
    onCancelDelete,
    onConfirmDelete,
    onDelete,
    onSearchTermChange,
    pendingDeleteTemplate,
    searchTerm,
  } = useAdminTemplatesScreenState({
    initialHighlightedTemplateId,
  });

  return (
    <>
      <section>
        <EventTemplatesListPanel
          deletePending={deletePending}
          highlightedTemplateId={highlightedTemplateId}
          listError={listError}
          onDelete={onDelete}
          onSearchTermChange={onSearchTermChange}
          searchTerm={searchTerm}
          templates={filteredTemplates}
        />
      </section>

      <ConfirmDialog
        confirmLabel="삭제"
        description={
          pendingDeleteTemplate
            ? `"${pendingDeleteTemplate.name}" 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
            : "선택한 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다."
        }
        onConfirm={onConfirmDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onCancelDelete();
          }
        }}
        open={pendingDeleteTemplate !== null}
        title="템플릿을 삭제할까요?"
      />
    </>
  );
}
