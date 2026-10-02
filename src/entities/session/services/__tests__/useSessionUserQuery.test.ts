import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/entities/session/services/useSessionUserQuery.ts
//
// 「지금 누가 들어와 있나」를 읽는 자리 하나다. 지금은 화면 아홉과 라우트 셋이 저마다
// `useEffect` 안에서 `getCurrentUser(supabase)`를 부르고 `useState`에 받는다 — 같은 답을
// 열두 번 묻고, 받는 꼴도 셋으로 갈려 있다(`id`만 · `email`과 사진 · 둘 다).
//
// 이 훅이 그 열두 자리의 도구다. 꼴을 하나로 못 박고, 사진 주소를 꺼내는 일도 여기서 끝내
// 화면이 `googlePhotoOf`를 안 부른다(ADR-001의 「`.tsx`에 로직 금지」).

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useSessionUserQuery } =
  await import("@/entities/session/services/useSessionUserQuery");

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

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

beforeEach(() => {
  getCurrentUserMock.mockReset();
});

describe("useSessionUserQuery — 세션의 사람을 화면이 받을 꼴로 낸다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSessionUserQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getCurrentUserMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("id와 이메일과 구글 사진을 든 꼴로 낸다", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      user_metadata: { avatar_url: "https://photo.example/a.png" },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSessionUserQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({
      id: "user-1",
      email: "person@example.com",
      googlePhotoUrl: "https://photo.example/a.png",
    });
  });

  it("이메일이 없으면 빈 글자다 — 아바타가 이 값으로 글자를 짓는다", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: undefined,
      user_metadata: {},
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSessionUserQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({
      id: "user-1",
      email: "",
      googlePhotoUrl: null,
    });
  });

  it("사진 열쇠가 없으면 널이다", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      user_metadata: { name: "이름뿐" },
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSessionUserQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.googlePhotoUrl).toBeNull();
  });

  it("세션이 없으면 널이다 — 던지지 않는다", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSessionUserQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
  });

  it("['session','user']에 앉는다 — 열두 자리가 같은 답을 한 번만 묻는다", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      user_metadata: {},
    });
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useSessionUserQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["session", "user"])).toEqual({
      id: "user-1",
      email: "person@example.com",
      googlePhotoUrl: null,
    });
  });

  it("같은 키를 두 번 걸어도 DAL은 한 번만 불린다", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => ({
        first: useSessionUserQuery(FAKE_CLIENT),
        second: useSessionUserQuery(FAKE_CLIENT),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.first.isLoading).toBe(false));

    expect(getCurrentUserMock).toHaveBeenCalledTimes(1);
  });
});
