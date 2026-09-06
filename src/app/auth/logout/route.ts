import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";

export async function POST(request: NextRequest) {
  const client = createSupabaseServerClient(await cookies());

  await client.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), 303);
}
