import { z } from "zod";
import { replacementListItemSchema } from "#/entities/replacements/models/schemas/replacementRequest";

const fetchReplacementsResponseSchema = z.object({
  replacements: z.array(replacementListItemSchema),
});

export async function fetchReplacements() {
  const response = await fetch("/api/replacements", {
    cache: "no-store",
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch replacement requests");
  }

  const data = await response.json();

  return fetchReplacementsResponseSchema.parse(data).replacements;
}
