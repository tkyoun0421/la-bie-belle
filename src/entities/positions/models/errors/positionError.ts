import {
  createAppError,
  readAppErrorCode,
} from "#/shared/lib/errors/appError";

export const positionErrorCodes = {
  createFailed: "POSITION_CREATE_FAILED",
  createResultMissing: "POSITION_CREATE_RESULT_MISSING",
  deleteFailed: "POSITION_DELETE_FAILED",
  deleteInUse: "POSITION_DELETE_IN_USE",
  deleteTargetNotFound: "POSITION_DELETE_TARGET_NOT_FOUND",
  duplicateName: "POSITION_DUPLICATE_NAME",
  listFailed: "POSITION_LIST_FAILED",
  reorderFailed: "POSITION_REORDER_FAILED",
  updateFailed: "POSITION_UPDATE_FAILED",
  updateResultMissing: "POSITION_UPDATE_RESULT_MISSING",
} as const;

export type PositionErrorCode =
  (typeof positionErrorCodes)[keyof typeof positionErrorCodes];

const positionErrorCodeSet = new Set<string>(Object.values(positionErrorCodes));

export function createPositionError(
  code: PositionErrorCode,
  options?: ErrorOptions
) {
  return createAppError(code, options);
}

export function readPositionErrorCode(
  error: unknown
): PositionErrorCode | null {
  const code = readAppErrorCode(error);

  if (!code || !positionErrorCodeSet.has(code)) {
    return null;
  }

  return code as PositionErrorCode;
}
