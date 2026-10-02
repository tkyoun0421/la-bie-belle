import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/profileEdit/services/useSubmitProfileMutation.ts
//
// 가입 프로필을 보내는 쓰기다. 화면이 `async` 손으로 API를 직접 부르고 보낸 중·실패를
// `useState` 둘로 셈하고 있었다 — 무효화는 아예 없어, 보낸 뒤 「나」가 옛 값을 들고 있었다.

const submitProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/profileEdit/api/submitProfile.api",
  () => ({
    submitProfile: submitProfileMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { queryKeys } = await import("@/shared/api/queryKeys");
const { useSubmitProfileMutation } =
  await import("@/features/profileEdit/services/useSubmitProfileMutation");

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

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

const INPUT = {
  displayName: "이준호",
  phone: "010-0000-0001",
  birthDate: "1993-04-21",
  gender: "male",
};

beforeEach(() => {
  submitProfileMock.mockReset();
  submitProfileMock.mockResolvedValue(undefined);
});

describe("useSubmitProfileMutation — 보내고 나면 내 프로필이 낡는다", () => {
  it("적은 값을 그대로 보낸다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSubmitProfileMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => result.current.mutate(INPUT));

    await waitFor(() =>
      expect(submitProfileMock).toHaveBeenCalledWith(FAKE_CLIENT, INPUT),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("성공하면 프로필을 낡게 한다", async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSubmitProfileMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => result.current.mutate(INPUT));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.profile.all,
    });
  });

  it("넘어지면 오류가 선다", async () => {
    submitProfileMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSubmitProfileMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => result.current.mutate(INPUT));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("보내는 중에는 다시 안 보낸다", async () => {
    submitProfileMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSubmitProfileMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => result.current.mutate(INPUT));

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => result.current.mutate(INPUT));

    expect(submitProfileMock).toHaveBeenCalledTimes(1);
  });
});
