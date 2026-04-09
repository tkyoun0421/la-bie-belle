import { positionsResponseSchema } from "#/entities/positions/models/schemas/position";

export async function fetchPositions() {
  const response = await fetch("/api/positions", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch positions.");
  }

  const data = await response.json();

  return positionsResponseSchema.parse(data).positions;
}
