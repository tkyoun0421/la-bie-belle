"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "#/shared/components/common/ConfirmDialog";
import { EventTemplatesListPanel } from "#/screens/admin/templates/_components/EventTemplatesListPanel";
import { useAdminTemplatesScreenState } from "#/screens/admin/templates/_hooks/useAdminTemplatesScreenState";

type AdminTemplatesClientProps = {
  initialHighlightedTemplateId: string | null;
};

export function AdminTemplatesClient({
  initialHighlightedTemplateId,
}: Readonly<AdminTemplatesClientProps>) {
  const router = useRouter();
  const prefetchedHrefsRef = useRef<Set<string>>(new Set());
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

  useEffect(() => {
    const nextHrefs = [
      "/admin/templates/new",
      ...filteredTemplates
        .slice(0, 6)
        .map((template) => `/admin/templates/${template.id}/edit`),
    ];

    nextHrefs.forEach((href) => {
      if (prefetchedHrefsRef.current.has(href)) {
        return;
      }

      prefetchedHrefsRef.current.add(href);
      router.prefetch(href);
    });
  }, [filteredTemplates, router]);

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
