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
