import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const updateMyPhotoMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const uploadAvatarMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const pickAndShrinkPhotoMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/profileEdit/api/updateMyPhoto.api",
  () => ({
    updateMyPhoto: updateMyPhotoMock,
  }),
);

jest.unstable_mockModule(
  "@/features/profileEdit/api/avatarsBucket.api",
  () => ({
    uploadAvatar: uploadAvatarMock,
  }),
);

jest.unstable_mockModule("@/features/profileEdit/lib/pickPhoto.lib", () => ({
  pickAndShrinkPhoto: pickAndShrinkPhotoMock,
}));

jest.unstable_mockModule(
  "@/features/profileEdit/lib/photoPickDeps.lib",
  () => ({ PHOTO_PICK_DEPS: {} }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { usePhotoSheet } =
  await import("@/features/profileEdit/hooks/usePhotoSheet");

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

const SAVED = jest.fn();

const GOOGLE_PHOTO = "https://example.test/google.jpg";

function mounted(photoUrl: string | null = null) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      usePhotoSheet({
        userId: "user-1",
        photoUrl,
        googlePhotoUrl: GOOGLE_PHOTO,
        onSaved: () => SAVED(),
      }),
    { wrapper },
  );
}

beforeEach(() => {
  updateMyPhotoMock.mockReset().mockResolvedValue(undefined);
  uploadAvatarMock.mockReset().mockResolvedValue("https://example.test/up.jpg");
  pickAndShrinkPhotoMock.mockReset().mockResolvedValue({
    uri: "file:///shrunk.jpg",
    contentType: "image/jpeg",
    extension: "jpg",
  });
  SAVED.mockReset();
});

describe("usePhotoSheet — 조각이 자기 쓰기를 삼킨다", () => {
  it("구글 사진이 있고 내 사진이 없으면 권한다", () => {
    const { result } = mounted();

    expect(result.current.offerGoogle).toBe(true);
  });

  it("쓰는 사진이 이미 구글 사진이면 안 권한다", () => {
    const { result } = mounted(GOOGLE_PHOTO);

    expect(result.current.offerGoogle).toBe(false);
  });

  it("고른 사진은 올려 앉힌다", async () => {
    const { result } = mounted();

    act(() => void result.current.pick());

    await waitFor(() =>
      expect(uploadAvatarMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        userId: "user-1",
        uri: "file:///shrunk.jpg",
        contentType: "image/jpeg",
        extension: "jpg",
      }),
    );

    await waitFor(() => expect(SAVED).toHaveBeenCalled());
  });

  it("고르다 말면 아무 일도 없다", async () => {
    pickAndShrinkPhotoMock.mockResolvedValue(null);

    const { result } = mounted();

    await act(async () => {
      await result.current.pick();
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
    expect(result.current.failed).toBe(false);
    expect(SAVED).not.toHaveBeenCalled();
  });

  it("고르다 넘어지면 실패가 선다", async () => {
    pickAndShrinkPhotoMock.mockRejectedValue(new Error("못 줄였다"));

    const { result } = mounted();

    await act(async () => {
      await result.current.pick();
    });

    expect(result.current.failed).toBe(true);
  });

  it("올리다 넘어져도 실패가 선다", async () => {
    uploadAvatarMock.mockRejectedValue(new Error("못 올렸다"));

    const { result } = mounted();

    act(() => void result.current.pick());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(SAVED).not.toHaveBeenCalled();
  });

  it("구글 사진은 올릴 것 없이 앉힌다", async () => {
    const { result } = mounted();

    act(() => result.current.useGoogle());

    await waitFor(() =>
      expect(updateMyPhotoMock).toHaveBeenCalledWith(FAKE_CLIENT, GOOGLE_PHOTO),
    );

    expect(uploadAvatarMock).not.toHaveBeenCalled();
  });

  it("고르는 동안과 올리는 동안을 하나로 든다", async () => {
    let release: (picked: unknown) => void = () => {};

    pickAndShrinkPhotoMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    const { result } = mounted();

    act(() => void result.current.pick());

    await waitFor(() => expect(result.current.uploading).toBe(true));

    await act(async () => {
      release(null);
    });

    await waitFor(() => expect(result.current.uploading).toBe(false));
  });
});
