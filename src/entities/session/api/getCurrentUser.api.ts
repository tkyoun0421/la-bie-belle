import { isAuthSessionMissingError, type User } from "@supabase/supabase-js";
import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

export async function getCurrentUser(client: DB): Promise<User | null> {
  const { data, error } = await client.auth.getUser();

  if (error === null) {
    return data.user;
  }

  if (isAuthSessionMissingError(error)) {
    return null;
  }

  throw toApiError(error);
}
