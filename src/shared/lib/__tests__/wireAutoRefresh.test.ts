import { jest } from "@jest/globals";
import { wireAutoRefresh } from "@/shared/lib/wire-auto-refresh";

type AppStateListener = (state: string) => void;

function fakeAppState() {
  let capturedListener: AppStateListener | null = null;
  const removeMock = jest.fn();
  const addEventListener = jest.fn(
    (_event: string, listener: AppStateListener) => {
      capturedListener = listener;
      return { remove: removeMock };
    },
  );

  return {
    addEventListener,
    removeMock,
    fire: (state: string) => capturedListener?.(state),
  };
}

function fakeAuth() {
  return {
    startAutoRefresh: jest.fn(async () => {}),
    stopAutoRefresh: jest.fn(async () => {}),
  };
}

describe("wireAutoRefresh — 앱 상태에 따라 토큰 자동 갱신을 켜고 끈다", () => {
  it("active로 바뀌면 startAutoRefresh를 정확히 한 번 부른다", () => {
    const appState = fakeAppState();
    const auth = fakeAuth();
    wireAutoRefresh(auth, appState);

    appState.fire("active");

    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).not.toHaveBeenCalled();
  });

  it("background로 바뀌면 stopAutoRefresh를 정확히 한 번 부른다", () => {
    const appState = fakeAppState();
    const auth = fakeAuth();
    wireAutoRefresh(auth, appState);

    appState.fire("background");

    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.startAutoRefresh).not.toHaveBeenCalled();
  });

  it("active 뒤 background로 바뀌면 각각 정확히 한 번씩만 불린다", () => {
    const appState = fakeAppState();
    const auth = fakeAuth();
    wireAutoRefresh(auth, appState);

    appState.fire("active");
    appState.fire("background");

    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});
