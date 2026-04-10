import { positionsResponseSchema } from "#/entities/positions/models/schemas/position";
import {
  createAppError,
  readApiErrorCode,
} from "#/shared/lib/errors/appError";

export async function fetchPositions() {
  const response = await fetch("/api/positions", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorCode = readApiErrorCode(payload);

    if (errorCode) {
      throw createAppError(errorCode);
    }

    throw new Error("Failed to fetch positions.");
  }

  const data = await response.json();

  return positionsResponseSchema.parse(data).positions;
}
