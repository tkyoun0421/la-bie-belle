import { AppState } from "react-native";

type AutoRefreshAuth = {
  startAutoRefresh: () => unknown;
  stopAutoRefresh: () => unknown;
};

type AppStateSource = {
  addEventListener: (
    event: "change",
    listener: (state: string) => void,
  ) => { remove: () => void };
};

/**
 * 뒤에 있는 앱에서 갱신 타이머를 돌리면 네트워크 없는 동안 실패만 쌓인다.
 * 앞으로 돌아올 때 한 번 갱신하면 같은 일이 된다.
 *
 * AppState를 인자로 받는 이유는 대역이 안 서기 때문이다 — 러너가 react-native를
 * 절대경로로 리매핑해서 이 파일 안의 import는 늘 실물을 문다. 기본값에 실물을
 * 두면 부르는 쪽은 그대로다.
 */
export function wireAutoRefresh(
  auth: AutoRefreshAuth,
  appState: AppStateSource = AppState,
): () => void {
  const subscription = appState.addEventListener("change", (state) => {
    if (state === "active") {
      auth.startAutoRefresh();
      return;
    }

    auth.stopAutoRefresh();
  });

  return () => subscription.remove();
}
