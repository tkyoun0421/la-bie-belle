import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRequestClient } from "@/shared/lib/create-supabase-request-client";

export async function POST(request: NextRequest) {
  const client = await createSupabaseRequestClient();

  await client.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), 303);
}
