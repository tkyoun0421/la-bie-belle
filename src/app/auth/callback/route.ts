import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRequestClient } from "@/shared/lib/create-supabase-request-client";
import { handleAuthCallback } from "@/shared/lib/handle-auth-callback";

export async function GET(request: NextRequest) {
  const client = await createSupabaseRequestClient();

  const destination = await handleAuthCallback(
    request.nextUrl.searchParams.get("code"),
    client,
  );

  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
