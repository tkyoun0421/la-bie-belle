import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";
import { handleAuthCallback } from "@/shared/lib/handle-auth-callback";

export async function GET(request: NextRequest) {
  const client = createSupabaseServerClient(await cookies());

  const destination = await handleAuthCallback(
    request.nextUrl.searchParams.get("code"),
    client,
  );

  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
