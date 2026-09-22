import type { Db } from "@/shared/api/database";

export async function ensureProfile(client: Db): Promise<void> {
  const { error } = await client.rpc("ensure_profile");

  if (error) {
    throw error;
  }
}
