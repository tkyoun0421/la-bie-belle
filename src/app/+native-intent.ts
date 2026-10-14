import { redirectNativeIntentPath } from "@/features/auth/model/nativeIntent.policy";

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  return redirectNativeIntentPath(path);
}
