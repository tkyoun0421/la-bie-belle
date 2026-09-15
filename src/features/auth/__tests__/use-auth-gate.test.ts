// @vitest-environment jsdom
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseBrowserClient } from "@/shared/lib/create-supabase-browser-client";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { ensureProfile } from "@/entities/profile/dals/ensure-profile";
import { getMyProfile } from "@/entities/profile/dals/get-my-profile";
import {
  profileQueryOptions,
  useAuthGate,
} from "@/features/auth/use-auth-gate";

const { replaceMock, pathnameMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  pathnameMock: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock(),
}));

vi.mock("@/shared/lib/create-supabase-browser-client", () => ({
  createSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/shared/lib/get-current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/entities/profile/dals/ensure-profile", () => ({
  ensureProfile: vi.fn(),
}));

vi.mock("@/entities/profile/dals/get-my-profile", () => ({
  getMyProfile: vi.fn(),
}));

type ProfileRow = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  role: string;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  blocked_at: string | null;
  left_at: string | null;
};

function profileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "profile-1",
    display_name: null,
    photo_url: null,
    role: "member",
    submitted_at: null,
    approved_at: null,
    rejected_at: null,
    blocked_at: null,
    left_at: null,
    ...overrides,
  };
}

function fakeUser(
  overrides: {
    email?: string;
    user_metadata?: Record<string, unknown>;
  } = {},
): User {
  return {
    id: "user-1",
    email: overrides.email ?? "person@example.com",
    user_metadata: overrides.user_metadata ?? {},
  } as unknown as User;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  pathnameMock.mockReturnValue("/");
  vi.mocked(createSupabaseBrowserClient).mockReturnValue({} as SupabaseClient);
});

describe("useAuthGate — 세션이 없을 때", () => {
  it("프로필을 확인하지 않고 로그인 목적지로 정리된다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(ensureProfile).not.toHaveBeenCalled();
    expect(result.current.destination).toBe("/login");
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("이미 로그인 화면에 있으면 이동하지 않는다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    pathnameMock.mockReturnValue("/login");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(replaceMock).not.toHaveBeenCalled();
  });
});

describe("useAuthGate — 세션이 있을 때 읽는 순서", () => {
  it("ensureProfile을 getMyProfile보다 먼저 부른다", async () => {
    const callOrder: string[] = [];
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockImplementation(async () => {
      callOrder.push("ensureProfile");
    });
    vi.mocked(getMyProfile).mockImplementation(async () => {
      callOrder.push("getMyProfile");
      return profileRow({ approved_at: "2026-09-01T00:00:00.000Z" });
    });
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(callOrder).toEqual(["ensureProfile", "getMyProfile"]);
  });

  it("읽기가 끝나기 전에는 status가 loading이다", async () => {
    let resolveProfile: (row: ProfileRow) => void = () => {};
    const pending = new Promise<ProfileRow>((resolve) => {
      resolveProfile = resolve;
    });

    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockReturnValue(pending);
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(getMyProfile).toHaveBeenCalled());
    expect(result.current.status).toBe("loading");

    await act(async () => {
      resolveProfile(profileRow({ approved_at: "2026-09-01T00:00:00.000Z" }));
      await pending;
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});

describe("useAuthGate — 제 자리가 아니면 옮긴다", () => {
  it("승인된 사람이 대기 화면에 있으면 홈으로 옮긴다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockResolvedValue(
      profileRow({ approved_at: "2026-09-01T00:00:00.000Z" }),
    );
    pathnameMock.mockReturnValue("/pending");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(replaceMock).toHaveBeenCalledWith("/");
  });

  it("승인된 사람이 홈에 있으면 이동하지 않는다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockResolvedValue(
      profileRow({ approved_at: "2026-09-01T00:00:00.000Z" }),
    );
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("차단된 사람이 홈에 있으면 차단 화면으로 옮긴다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockResolvedValue(
      profileRow({ blocked_at: "2026-09-05T00:00:00.000Z" }),
    );
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(replaceMock).toHaveBeenCalledWith("/blocked");
  });
});

describe("useAuthGate — 계정 값 노출", () => {
  it("로그인한 사람의 이메일과 구글 사진이 값으로 나온다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(
      fakeUser({
        email: "member@example.com",
        user_metadata: { avatar_url: "https://example.com/avatar.png" },
      }),
    );
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockResolvedValue(
      profileRow({ approved_at: "2026-09-01T00:00:00.000Z" }),
    );
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.email).toBe("member@example.com");
    expect(result.current.avatarUrl).toBe("https://example.com/avatar.png");
  });
});

describe("useAuthGate — 읽기 실패와 재시도", () => {
  it("ensureProfile이 실패하면 status가 error이고 retry로 다시 시도해 ready가 된다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockRejectedValueOnce(new Error("network error"));
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockResolvedValue(
      profileRow({ approved_at: "2026-09-01T00:00:00.000Z" }),
    );
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("getMyProfile이 실패해도 status가 error다", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(fakeUser());
    vi.mocked(ensureProfile).mockResolvedValue(undefined);
    vi.mocked(getMyProfile).mockRejectedValue(new Error("network error"));
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => useAuthGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});

describe("profileQueryOptions — 프로필 쿼리의 캐시 규칙", () => {
  it("queryKey가 ['profile']이고 staleTime이 0이고 refetchOnWindowFocus가 true다", () => {
    const options = profileQueryOptions({} as SupabaseClient, "user-1");

    expect(options.queryKey).toEqual(["profile"]);
    expect(options.staleTime).toBe(0);
    expect(options.refetchOnWindowFocus).toBe(true);
  });
});
