import { redirect } from "next/navigation";
import { createSupabaseRequestClient } from "@/shared/lib/create-supabase-request-client";
import {
  readAuthGate,
  type SignedInAccount,
} from "@/features/auth/read-auth-gate";

export async function enterRoute(expected: "/login" | "/"): Promise<void> {
  const { destination } = await readAuthGate(
    await createSupabaseRequestClient(),
  );

  if (destination !== expected) {
    redirect(destination);
  }
}

export async function enterPendingRoute(): Promise<SignedInAccount> {
  const { destination, account } = await readAuthGate(
    await createSupabaseRequestClient(),
  );

  if (destination !== "/pending" || !account) {
    redirect(destination);
  }

  return account;
}
