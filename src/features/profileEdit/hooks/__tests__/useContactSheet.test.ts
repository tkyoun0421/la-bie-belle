import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const updateMyContactMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/profileEdit/api/updateMyContact.api",
  () => ({ updateMyContact: updateMyContactMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { CONTACT_SHEET_COPY } =
  await import("@/features/profileEdit/consts/profileEdit.const");
const { useContactSheet } =
  await import("@/features/profileEdit/hooks/useContactSheet");

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

function mounted(phone = "010-0000-0001") {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useContactSheet({
        profileId: "profile-1",
        phone,
        onSaved: () => SAVED(),
      }),
    { wrapper },
  );
}

beforeEach(() => {
  updateMyContactMock.mockReset().mockResolvedValue(undefined);
  SAVED.mockReset();
});

describe("useContactSheet — 조각이 자기 쓰기를 삼킨다", () => {
  it("열면 적힌 번호가 숫자로 들어 있고 아직 저장할 것이 없다", () => {
    const { result } = mounted();

    expect(result.current.draft).toBe("01000000001");
    expect(result.current.canSave).toBe(false);
  });

  it("고치면 저장할 수 있다", () => {
    const { result } = mounted();

    act(() => result.current.write("01000000002"));

    expect(result.current.draft).toBe("01000000002");
    expect(result.current.canSave).toBe(true);
  });

  it("열한 자리를 넘겨 적어도 열한 자리만 담는다", () => {
    const { result } = mounted();

    act(() => result.current.write("010000000029999"));

    expect(result.current.draft).toBe("01000000002");
  });

  it("저장하면 하이픈을 넣어 보낸다", async () => {
    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() =>
      expect(updateMyContactMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "profile-1",
        "010-0000-0002",
      ),
    );
  });

  it("보내고 나면 끝났다고 알린다", async () => {
    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() => expect(SAVED).toHaveBeenCalled());
  });

  it("서버가 꼴을 물리면 틀렸다고만 하고 통신 실패로는 말하지 않는다", async () => {
    updateMyContactMock.mockRejectedValue(new DomainError("invalid_phone"));

    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.invalid).toBe(true));

    expect(result.current.failedLine).toBeNull();
    expect(SAVED).not.toHaveBeenCalled();
  });

  it("통신이 끊기면 「보내지 못했어요」다", async () => {
    updateMyContactMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.invalid).toBe(false);
  });

  it("보내는 중은 자기가 든다", async () => {
    let release: () => void = () => {};

    updateMyContactMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.sending).toBe(true));

    act(() => release());

    await waitFor(() => expect(result.current.sending).toBe(false));
  });
});

describe("useContactSheet — 연락처가 틀렸다는 판정이 하나다", () => {
  it("꼴이 안 맞게 열한 자리를 적으면 틀렸다고 한다", () => {
    const { result } = mounted();

    act(() => result.current.write("01100000002"));

    expect(result.current.invalid).toBe(true);
  });

  it("열한 자리를 다 적기 전에는 틀렸다고 하지 않는다", () => {
    const { result } = mounted();

    act(() => result.current.write("0110000"));

    expect(result.current.invalid).toBe(false);
  });
});

describe("useContactSheet — 실패 문안을 controller가 완성해 내려준다", () => {
  it("통신이 끊기면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    updateMyContactMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(CONTACT_SHEET_COPY.sendFailed);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    updateMyContactMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.write("01000000002"));
    act(() => result.current.save());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.failedLine).toBeTruthy();
  });
});
