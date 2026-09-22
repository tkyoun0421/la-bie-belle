import Constants from "expo-constants";

const SCHEME = "labiebelle";

/**
 * Expo Go는 앱 스킴을 못 쓴다 — 번들을 내려받아 대신 돌리는 껍데기라 제 주소로
 * 받아서 `/--/` 뒤를 앱에 넘긴다. dev client와 스토어 빌드는 제 스킴을 가진다.
 * 런타임마다 달라서 주소를 코드에 박지 않고 여기서 만든다.
 */
export function makeAuthRedirectUri(path: string): string {
  if (Constants.executionEnvironment === "storeClient") {
    return `exp://${Constants.expoConfig?.hostUri}/--/${path}`;
  }

  return `${SCHEME}://${path}`;
}

export function extractAuthCode(url: string): string | null {
  const queryStart = url.indexOf("?");

  if (queryStart < 0) {
    return null;
  }

  return new URLSearchParams(url.slice(queryStart + 1)).get("code");
}
