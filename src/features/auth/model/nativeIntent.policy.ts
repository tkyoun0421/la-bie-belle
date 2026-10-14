import { LOGIN_PATH } from "@/shared/consts/navigation.const";
import { AUTH_CALLBACK_PATH } from "@/features/auth/consts/auth.const";

const CALLBACK_ROUTE = new RegExp(`(^|/)${AUTH_CALLBACK_PATH}$`);

export function redirectNativeIntentPath(path: string): string {
  const route = path.replace(/[?#].*$/, "");

  return CALLBACK_ROUTE.test(route) ? LOGIN_PATH : path;
}
