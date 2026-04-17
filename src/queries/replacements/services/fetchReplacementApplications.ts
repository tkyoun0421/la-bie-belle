import { z } from "zod";

const replacementApplicationItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string(),
  appliedAt: z.string(),
});

const fetchReplacementApplicationsResponseSchema = z.object({
  applications: z.array(replacementApplicationItemSchema),
});

export async function fetchReplacementApplications(requestId: string) {
  const response = await fetch(`/api/replacements/${requestId}/applications`, {
    cache: "no-store",
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch replacement applications");
  }

  const data = await response.json();

  return fetchReplacementApplicationsResponseSchema.parse(data).applications;
}
