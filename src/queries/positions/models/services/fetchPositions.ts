import { positionsResponseSchema } from "#/queries/positions/models/schemas/position";

export async function fetchPositions() {
  const response = await fetch("/api/positions", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("포지션 목록을 불러오지 못했습니다.");
  }

  const data = await response.json();

  return positionsResponseSchema.parse(data).positions;
}
