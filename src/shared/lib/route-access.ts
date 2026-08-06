import {
  AUTH_CALLBACK_PATH,
  HOME_PATH,
  LOGIN_PATH,
  PRIVACY_PATH,
} from "@/shared/config/auth-routes.config";

export const PUBLIC_PATHS = [
  LOGIN_PATH,
  AUTH_CALLBACK_PATH,
  "/preview",
  "/catalog",
  PRIVACY_PATH,
] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path);
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
