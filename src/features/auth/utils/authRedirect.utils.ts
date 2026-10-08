import {
  readExpoHostUri,
  readIsExpoGo,
} from "@/features/auth/config/auth.config";
import { APP_SCHEME } from "@/features/auth/consts/auth.const";

export function makeAuthRedirectUri(path: string): string {
  if (readIsExpoGo()) {
    return `exp://${readExpoHostUri()}/--/${path}`;
  }

  return `${APP_SCHEME}://${path}`;
}

export function extractAuthCode(url: string): string | null {
  const queryStart = url.indexOf("?");

  if (queryStart < 0) {
    return null;
  }

  return new URLSearchParams(url.slice(queryStart + 1)).get("code");
}
