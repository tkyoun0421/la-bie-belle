import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setNotificationsEnabledMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const savePushTokenMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPushPermissionMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const requestPushPermissionMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/pushSwitch/api/setNotificationsEnabled.api",
  () => ({ setNotificationsEnabled: setNotificationsEnabledMock }),
);

jest.unstable_mockModule("@/features/pushSwitch/api/savePushToken.api", () => ({
  savePushToken: savePushTokenMock,
}));

jest.unstable_mockModule(
  "@/features/pushSwitch/lib/pushPermission.lib",
  () => ({
    getPushPermission: getPushPermissionMock,
    requestPushPermission: requestPushPermissionMock,
  }),
);

jest.unstable_mockModule("@/features/pushSwitch/lib/pushDeps.lib", () => ({
  PUSH_DEPS: { getPermissionsAsync: jest.fn() },
}));

jest.unstable_mockModule("@/shared/lib/appState.lib", () => ({
  APP_STATE: { addEventListener: () => ({ remove: () => {} }) },
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useProfileNotificationRow } =
  await import("@/features/pushSwitch/hooks/useProfileNotificationRow");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper };
}

function mounted(enabled: boolean | null = true) {
  const { wrapper } = createWrapper();

  return renderHook(() => useProfileNotificationRow(enabled), { wrapper });
}

beforeEach(() => {
  setNotificationsEnabledMock.mockReset().mockResolvedValue(undefined);
  savePushTokenMock.mockReset().mockResolvedValue(undefined);
  getPushPermissionMock.mockReset().mockResolvedValue("granted");
  requestPushPermissionMock
    .mockReset()
    .mockResolvedValue({ permission: "granted", token: "tok-1" });
});

describe("useProfileNotificationRow — 줄의 꼴을 조각이 정한다", () => {
  it("권한이 허락이면 스위치가 선다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.row.kind).toBe("switch"));

    expect(result.current.on).toBe(true);
  });

  it("거부된 기기에는 스위치 대신 안내가 선다", async () => {
    getPushPermissionMock.mockResolvedValue("denied");

    const { result } = mounted();

    await waitFor(() => expect(result.current.row.kind).toBe("notice"));
  });

  it("아직 프로필을 못 읽었으면 스위치가 잠겨 있다", () => {
    const { result } = mounted(null);

    expect(result.current.row.kind).toBe("switch");
    expect(result.current.row.state).toBe("locked");
  });
});

describe("useProfileNotificationRow — 끄기는 묻고 나서 보낸다", () => {
  it("끄려 하면 먼저 묻는다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.row.kind).toBe("switch"));

    act(() => result.current.flip(false));

    expect(result.current.asking).toBe(true);
    expect(setNotificationsEnabledMock).not.toHaveBeenCalled();
  });

  it("묻고 나서 그렇다고 하면 보낸다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.row.kind).toBe("switch"));

    act(() => result.current.flip(false));
    act(() => result.current.confirmTurnOff());

    expect(result.current.asking).toBe(false);

    await waitFor(() =>
      expect(setNotificationsEnabledMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        false,
      ),
    );
  });

  it("묻다 말면 안 보낸다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.row.kind).toBe("switch"));

    act(() => result.current.flip(false));
    act(() => result.current.cancelTurnOff());

    expect(result.current.asking).toBe(false);
    expect(setNotificationsEnabledMock).not.toHaveBeenCalled();
  });

  it("켜기는 묻지 않고 바로 보내고 권한을 받아 기기를 앉힌다", async () => {
    const { result } = mounted(false);

    await waitFor(() => expect(result.current.row.kind).toBe("switch"));

    act(() => result.current.flip(true));

    expect(result.current.asking).toBe(false);

    await waitFor(() =>
      expect(setNotificationsEnabledMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        true,
      ),
    );

    await waitFor(() =>
      expect(savePushTokenMock).toHaveBeenCalledWith(FAKE_CLIENT, "tok-1"),
    );
  });
});
