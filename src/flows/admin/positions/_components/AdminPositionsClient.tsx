"use client";

import { PositionEditorCard } from "#/flows/admin/positions/_components/PositionEditorCard";
import { PositionsListPanel } from "#/flows/admin/positions/_components/PositionsListPanel";
import { usePositionEditorState } from "#/mutations/positions/hooks/usePositionEditorState";
import { usePositionCollectionState } from "#/queries/positions/hooks/usePositionCollectionState";

export function AdminPositionsClient() {
  const { filteredPositions, positions, searchTerm, setSearchTerm } =
    usePositionCollectionState();
  const {
    deletePositionMutation,
    editingPositionId,
    formError,
    formState,
    isSaving,
    remove,
    resetForm,
    setAllowedGender,
    setName,
    startEdit,
    submit,
  } = usePositionEditorState();

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <PositionEditorCard
        allowedGender={formState.allowedGender}
        error={formError}
        isEditing={editingPositionId !== null}
        isSaving={isSaving}
        name={formState.name}
        onAllowedGenderChange={setAllowedGender}
        onCancel={resetForm}
        onNameChange={setName}
        onSubmit={submit}
      />

      <PositionsListPanel
        isDeleting={deletePositionMutation.isPending}
        onDelete={remove}
        onEdit={startEdit}
        onSearchTermChange={setSearchTerm}
        positions={filteredPositions}
        searchTerm={searchTerm}
        totalCount={positions.length}
      />
    </section>
  );
}
