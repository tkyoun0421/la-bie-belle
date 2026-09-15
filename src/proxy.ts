import { type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";
import { getCurrentUser } from "@/shared/lib/get-current-user";

const STATIC_PATH_PREFIXES = ["/_next/static", "/_next/image"];

const STATIC_FILE_EXTENSION = /\.(?:ico|png|jpe?g|gif|svg|webp|avif)$/i;

const SESSIONLESS_PATH_PREFIXES = ["/login", "/auth"];

function isAtOrUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isStaticAssetPath(pathname: string): boolean {
  const underStaticPrefix = STATIC_PATH_PREFIXES.some((prefix) =>
    isAtOrUnder(pathname, prefix),
  );

  return underStaticPrefix || STATIC_FILE_EXTENSION.test(pathname);
}

function opensWithoutSession(pathname: string): boolean {
  return SESSIONLESS_PATH_PREFIXES.some((prefix) =>
    isAtOrUnder(pathname, prefix),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  const refreshed: { name: string; value: string; options: CookieOptions }[] =
    [];
  const responseHeaders = new Headers();

  const client = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    set: (name, value, options) => {
      request.cookies.set(name, value);
      refreshed.push({ name, value, options });
    },
    setHeader: (name, value) => {
      responseHeaders.set(name, value);
    },
  });

  const user = await getCurrentUser(client);

  const response =
    user || opensWithoutSession(pathname)
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL("/login", request.url));

  for (const { name, value, options } of refreshed) {
    response.cookies.set(name, value, options);
  }

  responseHeaders.forEach((value, name) => {
    response.headers.set(name, value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/).*)"],
};
