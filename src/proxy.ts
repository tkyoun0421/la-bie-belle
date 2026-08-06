import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { resolveAuthRedirect } from "@/shared/lib/route-access";
import { updateSupabaseSession } from "@/shared/lib/supabase-proxy-session";

export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSupabaseSession(request);
  const redirectPath = resolveAuthRedirect(request.nextUrl.pathname, isAuthenticated);

  if (redirectPath === null) {
    return response;
  }

  return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)"],
};
