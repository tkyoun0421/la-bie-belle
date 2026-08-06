export const PUBLIC_PATHS = ["/login", "/auth/callback", "/preview", "/catalog"] as const;

const HOME_PATH = "/";
const LOGIN_PATH = "/login";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function resolveAuthRedirect(pathname: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && !isPublicPath(pathname)) {
    return LOGIN_PATH;
  }

  if (isAuthenticated && pathname === LOGIN_PATH) {
    return HOME_PATH;
  }

  return null;
}
