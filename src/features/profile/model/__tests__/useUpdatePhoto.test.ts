import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 사진 고치기는 두 걸음이다 — 먼저 버킷에 올리고, 그 공개 주소를 profiles.photo_url에
// 앉힌다. 정본은 `docs/2-design/modules/account/design.md`의 「사진 저장」이다. 성공하면
// `['profile']`을 무효화한다.

const uploadAvatarMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateMyPhotoMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/dals/avatarsBucket", () => ({
  uploadAvatar: uploadAvatarMock,
  AVATARS_BUCKET: "avatars",
}));

jest.unstable_mockModule("@/entities/profile/dals/updateMyPhoto", () => ({
  updateMyPhoto: updateMyPhotoMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useUpdatePhoto } =
  await import("@/features/profile/model/useUpdatePhoto");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
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
  userId: "user-1",
  uri: "file:///tmp/photo.jpg",
  contentType: "image/jpeg",
  extension: "jpg",
};

beforeEach(() => {
  uploadAvatarMock.mockReset();
  updateMyPhotoMock.mockReset();
});

describe("useUpdatePhoto — uploadAvatar가 끝난 뒤에 updateMyPhoto를 부른다", () => {
  it("업로드로 받은 주소를 그대로 updateMyPhoto에 넘기고, 업로드가 먼저 끝난다", async () => {
    const order: string[] = [];
    uploadAvatarMock.mockImplementation(async () => {
      order.push("upload");
      return "https://example.com/new.jpg";
    });
    updateMyPhotoMock.mockImplementation(async () => {
      order.push("update");
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdatePhoto(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(order).toEqual(["upload", "update"]);
    expect(updateMyPhotoMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      "https://example.com/new.jpg",
    );
  });

  it("올리기가 실패하면 사진을 앉히는 호출 없이 error를 낸다", async () => {
    uploadAvatarMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdatePhoto(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(updateMyPhotoMock).not.toHaveBeenCalled();
  });

  it("성공하면 ['profile']을 무효화한다", async () => {
    uploadAvatarMock.mockResolvedValue("https://example.com/new.jpg");
    updateMyPhotoMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdatePhoto(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["profile"] }),
    );
  });
});
