import { jest } from "@jest/globals";
import type { AppStateStatus } from "react-native";

const savePushTokenMock = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.unstable_mockModule(
  "@/entities/notification/dals/save-push-token",
  () => ({
    savePushToken: savePushTokenMock,
  }),
);

const { renderHook, act, waitFor } =
  await import("@testing-library/react-native");
const { useSavePushToken } =
  await import("@/features/notification/model/useSavePushToken");

const FAKE_CLIENT = {} as never;

function createFakeAppState() {
  let listener: ((state: AppStateStatus) => void) | null = null;
  const remove = jest.fn();
  const addEventListener = jest.fn(
    (_event: "change", handler: (state: AppStateStatus) => void) => {
      listener = handler;
      return { remove };
    },
  );

  return {
    addEventListener,
    remove,
    fire: (state: AppStateStatus) => listener?.(state),
  };
}

beforeEach(() => {
  savePushTokenMock.mockReset();
  savePushTokenMock.mockResolvedValue(undefined);
});

describe("useSavePushToken — 앱이 뜨면 첫 진입으로 한 번 주소를 보낸다", () => {
  it("마운트하면 토큰으로 save_push_token을 한 번 부른다", async () => {
    const appState = createFakeAppState();

    renderHook(() => useSavePushToken(FAKE_CLIENT, "token-a", appState));

    await waitFor(() =>
      expect(savePushTokenMock).toHaveBeenCalledWith(FAKE_CLIENT, "token-a"),
    );
    expect(savePushTokenMock).toHaveBeenCalledTimes(1);
  });
});

describe("useSavePushToken — 토큰이 없으면 어떤 진입에도 아무것도 안 보낸다", () => {
  it("토큰이 null이면 마운트와 포그라운드 복귀 모두 save_push_token을 안 부른다", () => {
    const appState = createFakeAppState();

    renderHook(() => useSavePushToken(FAKE_CLIENT, null, appState));

    act(() => {
      appState.fire("background");
      appState.fire("active");
    });

    expect(savePushTokenMock).not.toHaveBeenCalled();
  });
});

describe("useSavePushToken — 포그라운드로 돌아올 때마다 다시 보낸다", () => {
  it("백그라운드에서 active로 돌아오면 두 번째로 보낸다", async () => {
    const appState = createFakeAppState();

    renderHook(() => useSavePushToken(FAKE_CLIENT, "token-a", appState));

    await waitFor(() => expect(savePushTokenMock).toHaveBeenCalledTimes(1));

    act(() => {
      appState.fire("background");
    });
    act(() => {
      appState.fire("active");
    });

    await waitFor(() => expect(savePushTokenMock).toHaveBeenCalledTimes(2));
  });
});

describe("useSavePushToken — 화면 사이를 오가는 것은 진입이 아니다", () => {
  it("active에서 active로 오는 전이에는 다시 안 보낸다", async () => {
    const appState = createFakeAppState();

    renderHook(() => useSavePushToken(FAKE_CLIENT, "token-a", appState));

    await waitFor(() => expect(savePushTokenMock).toHaveBeenCalledTimes(1));

    act(() => {
      appState.fire("active");
    });

    expect(savePushTokenMock).toHaveBeenCalledTimes(1);
  });
});

describe("useSavePushToken — 앱이 떠 있는 동안 주소가 바뀌면 새 주소로 다시 보낸다", () => {
  it("토큰 값이 바뀌면 바뀐 토큰으로 다시 부른다", async () => {
    const appState = createFakeAppState();

    const { rerender } = renderHook(
      ({ token }: { token: string }) =>
        useSavePushToken(FAKE_CLIENT, token, appState),
      { initialProps: { token: "token-a" } },
    );

    await waitFor(() =>
      expect(savePushTokenMock).toHaveBeenCalledWith(FAKE_CLIENT, "token-a"),
    );

    rerender({ token: "token-b" });

    await waitFor(() =>
      expect(savePushTokenMock).toHaveBeenCalledWith(FAKE_CLIENT, "token-b"),
    );
  });
});

describe("useSavePushToken — 언마운트하면 구독을 해제한다", () => {
  it("unmount하면 addEventListener가 돌려준 remove가 불린다", () => {
    const appState = createFakeAppState();

    const { unmount } = renderHook(() =>
      useSavePushToken(FAKE_CLIENT, "token-a", appState),
    );

    unmount();

    expect(appState.remove).toHaveBeenCalledTimes(1);
  });
});
