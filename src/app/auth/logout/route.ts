import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";

export async function POST() {
  const client = createSupabaseServerClient(await cookies());

  await client.auth.signOut();

  return new NextResponse(null, { status: 204 });
}
