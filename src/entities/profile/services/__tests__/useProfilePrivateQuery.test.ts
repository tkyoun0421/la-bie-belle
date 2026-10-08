import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useProfilePrivateQuery } =
  await import("@/entities/profile/services/useProfilePrivateQuery");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

const FAKE_CLIENT = {} as never;

const VALUES = {
  email: "someone@example.com",
  phone: "010-0000-0001",
  birth_date: "1998-03-04",
  gender: "male",
};

beforeEach(() => {
  getProfilePrivateMock.mockReset();
  getProfilePrivateMock.mockResolvedValue(VALUES);
});

describe("useProfilePrivateQuery — 사람마다 캐시가 갈린다", () => {
  it("그 사람 id로 읽는다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useProfilePrivateQuery(FAKE_CLIENT, "p1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toEqual(VALUES));

    expect(getProfilePrivateMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1");
  });

  it("사람이 없으면 안 읽는다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useProfilePrivateQuery(FAKE_CLIENT, null),
      { wrapper },
    );

    expect(getProfilePrivateMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("한 번도 안 보낸 사람이면 null이다", async () => {
    getProfilePrivateMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useProfilePrivateQuery(FAKE_CLIENT, "p1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeNull());
  });

  it("읽기가 넘어지면 값이 안 선다", async () => {
    getProfilePrivateMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useProfilePrivateQuery(FAKE_CLIENT, "p1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.data).toBeUndefined();
  });
});
