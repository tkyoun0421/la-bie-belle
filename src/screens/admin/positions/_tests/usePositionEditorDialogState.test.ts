import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  positionErrors,
  positionErrorCodes,
} from "#/entities/positions/models/errors/positionError";
import type { Position } from "#/entities/positions/models/schemas/position";
import { readPositionSaveErrorMessage } from "#/screens/admin/positions/_helpers/positionError";
import { usePositionEditorDialogState } from "#/screens/admin/positions/_hooks/usePositionEditorDialogState";

const createPositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

const updatePositionMutation = {
  isPending: false,
  mutateAsync: vi.fn(),
};

vi.mock("#/mutations/positions/hooks/useCreatePositionMutation", () => ({
  useCreatePositionMutation: () => createPositionMutation,
}));

vi.mock("#/mutations/positions/hooks/useUpdatePositionMutation", () => ({
  useUpdatePositionMutation: () => updatePositionMutation,
}));

const initialPosition: Position = {
  allowedGender: "all",
  defaultRequiredCount: 2,
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  name: "main",
  sortOrder: 1,
};

describe("usePositionEditorDialogState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a create session with default form values", async () => {
    const { result } = renderHook(() =>
      usePositionEditorDialogState({
        initialPosition: null,
        onClose: vi.fn(),
        requestKey: 1,
      })
    );

    await waitFor(() => {
      expect(result.current.isEditing).toBe(false);
      expect(result.current.name).toBe("");
      expect(result.current.defaultRequiredCount).toBe(2);
      expect(result.current.allowedGender).toBe("all");
    });
  });

  it("loads the selected position into the editor when edit starts", async () => {
    const { result } = renderHook(() =>
      usePositionEditorDialogState({
        initialPosition,
        onClose: vi.fn(),
        requestKey: 1,
      })
    );

    await waitFor(() => {
      expect(result.current.isEditing).toBe(true);
      expect(result.current.name).toBe("main");
      expect(result.current.defaultRequiredCount).toBe(2);
    });
  });

  it("exposes validation errors on the matching position fields", async () => {
    const { result } = renderHook(() =>
      usePositionEditorDialogState({
        initialPosition: null,
        onClose: vi.fn(),
        requestKey: 1,
      })
    );

    await act(async () => {
      await result.current.onSubmit();
    });

    await waitFor(() => {
      expect(result.current.fieldErrors.name).toBeTruthy();
      expect(result.current.serverError).toBeNull();
    });
  });

  it("maps position save error codes to editor messages", async () => {
    createPositionMutation.mutateAsync.mockRejectedValueOnce(
      positionErrors.create(positionErrorCodes.duplicateName)
    );

    const { result } = renderHook(() =>
      usePositionEditorDialogState({
        initialPosition: null,
        onClose: vi.fn(),
        requestKey: 1,
      })
    );

    act(() => {
      result.current.onNameChange("메인 안내");
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    await waitFor(() => {
      expect(result.current.serverError).toBe(
        readPositionSaveErrorMessage(
          positionErrors.create(positionErrorCodes.duplicateName)
        )
      );
    });
  });
});
