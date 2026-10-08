import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMyProfileQuery } =
  await import("@/entities/profile/services/useMyProfileQuery");

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

const PROFILE = {
  id: "profile-1",
  displayName: "박서연",
  photoUrl: null,
  role: "worker",
  submittedAt: "2026-09-01T00:00:00.000Z",
  approvedAt: "2026-09-02T00:00:00.000Z",
  rejectedAt: null,
  blockedAt: null,
  leftAt: null,
};

const PRIVATE_VALUES = {
  email: "person@example.com",
  phone: "010-0000-0001",
  birthDate: "1993-04-21",
  gender: "female",
};

beforeEach(() => {
  getMyProfileMock.mockReset();
  getProfilePrivateMock.mockReset();
});

describe("useMyProfileQuery — profile과 profile_private을 합쳐 하나로 낸다", () => {
  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMyProfileMock.mockReturnValue(new Promise(() => {}));
    getProfilePrivateMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      {
        wrapper,
      },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("둘 다 응답하면 값을 합쳐서 낸다", async () => {
    getMyProfileMock.mockResolvedValue(PROFILE);
    getProfilePrivateMock.mockResolvedValue(PRIVATE_VALUES);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(
      expect.objectContaining({
        displayName: "박서연",
        phone: "010-0000-0001",
        gender: "female",
      }),
    );
  });

  it("private 읽기가 실패하면 error를 낸다", async () => {
    getMyProfileMock.mockResolvedValue(PROFILE);
    getProfilePrivateMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMyProfileQuery(FAKE_CLIENT, "user-1"),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});
