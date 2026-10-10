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
const { PROFILE_FORM_COPY } =
  await import("@/features/profileEdit/consts/profileEdit.const");
const { usePendingEditor } =
  await import("@/features/profileEdit/hooks/usePendingEditor");

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

const UPLOADED = jest.fn();

function mounted(userId: string | null = "user-1") {
  const { wrapper } = createWrapper();

  return renderHook(
    () => usePendingEditor({ userId, onUploaded: () => UPLOADED() }),
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
  UPLOADED.mockReset();
});

describe("usePendingEditor — 사진 칸의 쓰기를 조각이 삼킨다", () => {
  it("고른 사진을 올리면 사진 칸이 굳는다", async () => {
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

    await waitFor(() => expect(UPLOADED).toHaveBeenCalled());
  });

  it("고르다 말면 칸이 그대로 열려 있다", async () => {
    pickAndShrinkPhotoMock.mockResolvedValue(null);

    const { result } = mounted();

    await act(async () => {
      await result.current.pick();
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
    expect(result.current.failed).toBe(false);
    expect(UPLOADED).not.toHaveBeenCalled();
  });

  it("고르다 넘어지면 실패가 선다", async () => {
    pickAndShrinkPhotoMock.mockRejectedValue(new Error("못 줄였다"));

    const { result } = mounted();

    await act(async () => {
      await result.current.pick();
    });

    expect(result.current.failed).toBe(true);
    expect(UPLOADED).not.toHaveBeenCalled();
  });

  it("세션이 없으면 올리지 않는다", async () => {
    const { result } = mounted(null);

    await act(async () => {
      await result.current.pick();
    });

    expect(uploadAvatarMock).not.toHaveBeenCalled();
  });

  it("올리는 동안을 자기가 든다", async () => {
    let release: () => void = () => {};

    uploadAvatarMock.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve("https://example.test/up.jpg");
        }),
    );

    const { result } = mounted();

    act(() => void result.current.pick());

    await waitFor(() => expect(result.current.uploading).toBe(true));

    await act(async () => {
      release();
    });

    await waitFor(() => expect(result.current.uploading).toBe(false));
  });
});

describe("usePendingEditor — 실패 문안을 controller가 완성해 내려준다", () => {
  it("고르다 넘어지면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    pickAndShrinkPhotoMock.mockRejectedValue(new Error("못 줄였다"));

    const { result } = mounted();

    await act(async () => {
      await result.current.pick();
    });

    // @ts-expect-error failedLine이 아직 없다
    expect(result.current.failedLine).toBe(PROFILE_FORM_COPY.photoFailed);
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    pickAndShrinkPhotoMock.mockRejectedValue(new Error("못 줄였다"));

    const { result } = mounted();

    await act(async () => {
      await result.current.pick();
    });

    expect(result.current.failed).toBe(true);

    // @ts-expect-error failedLine이 아직 없다
    expect(result.current.failedLine).toBeTruthy();
  });
});
