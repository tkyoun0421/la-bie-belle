"use server";

import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export type SignOutResult = { ok: false };

export async function signOut(): Promise<SignOutResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false };
  }

  redirect("/login");
}
