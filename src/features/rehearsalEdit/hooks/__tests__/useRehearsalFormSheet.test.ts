import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import type { RehearsalFormTarget } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";

const addRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const editRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/addRehearsal.api",
  () => ({ addRehearsal: addRehearsalMock }),
);

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/editRehearsal.api",
  () => ({ editRehearsal: editRehearsalMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useRehearsalFormSheet } =
  await import("@/features/rehearsalEdit/hooks/useRehearsalFormSheet");

const TIMED_ROW: Rehearsal = {
  id: "a",
  profileId: "me",
  workDate: "2026-10-05",
  startsAt: "14:00:00",
  endsAt: "16:00:00",
  count: null,
  name: null,
};

const ADD_TIME: RehearsalFormTarget = {
  mode: "add",
  workDate: "2026-10-05",
  formKind: "time",
};

const ADD_COUNT: RehearsalFormTarget = {
  mode: "add",
  workDate: "2026-10-05",
  formKind: "count",
};

const saved = jest.fn();

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

function mounted(target: RehearsalFormTarget = ADD_TIME) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useRehearsalFormSheet({
        target,
        dateLabel: "10월 5일 월요일",
        onSaved: saved,
      }),
    { wrapper },
  );
}

beforeEach(() => {
  addRehearsalMock.mockReset();
  editRehearsalMock.mockReset();
  saved.mockClear();
  addRehearsalMock.mockResolvedValue(undefined);
  editRehearsalMock.mockResolvedValue(undefined);
});

describe("useRehearsalFormSheet — 폼의 첫 모습이 무엇을 고치는지에 달렸다", () => {
  it("넣는 면은 빈 값으로 서고 보낼 수 없다", () => {
    const { result } = mounted();

    expect(result.current.values).toEqual({
      startsAt: "",
      endsAt: "",
      count: "",
    });
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it("줄을 눌러 고치면 그 줄의 값이 폼에 실려 온다", () => {
    const { result } = mounted({ mode: "edit", rehearsal: TIMED_ROW });

    expect(result.current.values).toEqual({
      startsAt: "14:00",
      endsAt: "16:00",
      count: "",
    });
  });
});

describe("useRehearsalFormSheet — 보내는 일을 자기가 든다", () => {
  it("넣은 것이 그날로 간다", async () => {
    const { result } = mounted();

    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() =>
      expect(addRehearsalMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        workDate: "2026-10-05",
        startsAt: "14:00",
        endsAt: "16:00",
      }),
    );
  });

  it("건수로 넣는 날은 건수만 보낸다", async () => {
    const { result } = mounted(ADD_COUNT);

    act(() => result.current.change({ count: "3" }));
    act(() => result.current.submit());

    await waitFor(() =>
      expect(addRehearsalMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        workDate: "2026-10-05",
        count: 3,
      }),
    );
  });

  it("보내고 나면 끝났다고 알린다", async () => {
    const { result } = mounted();

    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() => expect(saved).toHaveBeenCalled());
  });

  it("채우지 않은 폼은 안 보낸다", () => {
    const { result } = mounted();

    act(() => result.current.submit());

    expect(addRehearsalMock).not.toHaveBeenCalled();
  });

  it("고친 것을 보내면 그 줄의 id로 간다", async () => {
    const { result } = mounted({ mode: "edit", rehearsal: TIMED_ROW });

    act(() =>
      result.current.change({ startsAt: "15:00", endsAt: "17:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() =>
      expect(editRehearsalMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        id: "a",
        startsAt: "15:00",
        endsAt: "17:00",
      }),
    );
  });
});

describe("useRehearsalFormSheet — 넘어진 까닭이 폼 안에 선다", () => {
  it("보내기가 넘어지면 폼이 열린 채로 안내를 든다", async () => {
    addRehearsalMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.transportNotice).not.toBeNull());

    expect(saved).not.toHaveBeenCalled();
  });

  it("겹친다는 거절은 겹침 자리에 담긴다", async () => {
    addRehearsalMock.mockRejectedValue(new DomainError("overlaps"));

    const { result } = mounted();

    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.overlapsNotice).not.toBeNull());
  });

  it("근무가 바뀌었다는 거절은 갈래를 뒤집는다", async () => {
    addRehearsalMock.mockRejectedValue(new DomainError("wrong_kind"));

    const { result } = mounted();

    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.formKind).toBe("count"));

    expect(result.current.wrongKindNotice).not.toBeNull();
  });
});
