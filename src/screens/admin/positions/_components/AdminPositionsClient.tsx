"use client";

import { PositionEditorCard } from "#/screens/admin/positions/_components/PositionEditorCard";
import { PositionsListPanel } from "#/screens/admin/positions/_components/PositionsListPanel";
import { useAdminPositionsScreenState } from "#/screens/admin/positions/_hooks/useAdminPositionsScreenState";

export function AdminPositionsClient() {
  const {
    allowedGender,
    editingPositionId,
    error,
    filteredPositions,
    isDeleting,
    isSaving,
    name,
    onAllowedGenderChange,
    onCancel,
    onDelete,
    onEdit,
    onNameChange,
    onSearchTermChange,
    onSubmit,
    positions,
    searchTerm,
  } = useAdminPositionsScreenState();

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <PositionEditorCard
        allowedGender={allowedGender}
        error={error}
        isEditing={editingPositionId !== null}
        isSaving={isSaving}
        name={name}
        onAllowedGenderChange={onAllowedGenderChange}
        onCancel={onCancel}
        onNameChange={onNameChange}
        onSubmit={onSubmit}
      />

      <PositionsListPanel
        isDeleting={isDeleting}
        onDelete={onDelete}
        onEdit={onEdit}
        onSearchTermChange={onSearchTermChange}
        positions={filteredPositions}
        searchTerm={searchTerm}
        totalCount={positions.length}
      />
    </section>
  );
}
