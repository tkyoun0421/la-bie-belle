import type { DB } from "@/shared/api/database";

export async function ensureProfile(client: DB): Promise<void> {
  const { error } = await client.rpc("ensure_profile");

  if (error) {
    throw error;
  }
}
