import {
  readExpoHostUri,
  readIsExpoGo,
} from "@/features/auth/config/auth.config";
import { APP_SCHEME } from "@/features/auth/consts/auth.const";

/**
 * Expo Go는 앱 스킴을 못 쓴다 — 번들을 내려받아 대신 돌리는 껍데기라 제 주소로
 * 받아서 `/--/` 뒤를 앱에 넘긴다. dev client와 스토어 빌드는 제 스킴을 가진다.
 * 런타임마다 달라서 주소를 코드에 박지 않고 여기서 만든다.
 *
 * 무엇이 앱을 돌리는지는 `config`가 읽고 스킴은 `consts`가 든다 — 이 함수가 하는 일은
 * 그 둘을 주소 꼴로 짜는 것뿐이다.
 */
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
