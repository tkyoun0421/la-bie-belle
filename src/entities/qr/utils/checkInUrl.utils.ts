import { CHECK_IN_PATH } from "@/shared/consts/navigation.const";

export function buildCheckInUrl(appUrl: string, code: string): string {
  const origin = appUrl.replace(/\/+$/, "");

  return `${origin}${CHECK_IN_PATH}?c=${encodeURIComponent(code)}`;
}
