import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/rehearsal/hooks/useRehearsalScreen.ts
//
// 리허설 화면의 controller다. `.tsx`가 `useState` 여섯과 `useReducer` 하나와 `useEffect`
// 일곱을 들고 있었다 — 세션을 읽는 것, 경로의 달을 받는 것, 보낸 뒤 시트를 닫는 것, 실패를
// 폼의 안내로 옮기는 것, 기기 뒤로를 가로채는 것이 그 일곱이다.
//
// **읽는 질의가 둘인데 한 번에 하나만 돈다.** 관리자는 전원 것을, 근무자는 자기 것을 읽고
// 그 가름이 프로필의 역할이라 세션을 읽어야 비로소 정해진다.
//
// **시트 열림 둘이 UI 상태가 아니다.** 폼 시트는 보낸 것이 성공하면 저절로 닫히고, 지우기
// 확인창도 그렇다. 달 고르기만 사람이 열고 사람이 닫아 `.tsx`에 남는다.

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getAllRehearsalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const addRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const editRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const removeRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
}));

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getMyRehearsals.api",
  () => ({ getMyRehearsals: getMyRehearsalsMock }),
);

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getAllRehearsals.api",
  () => ({ getAllRehearsals: getAllRehearsalsMock }),
);

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({ getMonthSchedule: getMonthScheduleMock }),
);

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/addRehearsal.api",
  () => ({ addRehearsal: addRehearsalMock }),
);

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/editRehearsal.api",
  () => ({ editRehearsal: editRehearsalMock }),
);

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/removeRehearsal.api",
  () => ({ removeRehearsal: removeRehearsalMock }),
);

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useRehearsalScreen } =
  await import("@/screens/rehearsal/hooks/useRehearsalScreen");

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

const FAKE_CLIENT = {} as never;

function rehearsalAt(id: string, workDate: string) {
  return {
    id,
    work_date: workDate,
    starts_at: "14:00:00",
    ends_at: "16:00:00",
    count: null,
    profile_id: "me",
  };
}

beforeEach(() => {
  getCurrentUserMock.mockReset();
  getMyProfileMock.mockReset();
  getProfilePrivateMock.mockReset();
  getMyRehearsalsMock.mockReset();
  getAllRehearsalsMock.mockReset();
  getMonthScheduleMock.mockReset();
  addRehearsalMock.mockReset();
  editRehearsalMock.mockReset();
  removeRehearsalMock.mockReset();

  getCurrentUserMock.mockResolvedValue({ id: "user-1", user_metadata: {} });
  getMyProfileMock.mockResolvedValue({ id: "me", role: "worker" });
  getProfilePrivateMock.mockResolvedValue({ phone: "010-0000-0001" });
  getMyRehearsalsMock.mockResolvedValue([]);
  getAllRehearsalsMock.mockResolvedValue([]);
  getMonthScheduleMock.mockResolvedValue([]);
  addRehearsalMock.mockResolvedValue(undefined);
  editRehearsalMock.mockResolvedValue(undefined);
  removeRehearsalMock.mockResolvedValue(undefined);
});

async function mounted(month?: string) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useRehearsalScreen(FAKE_CLIENT, month), {
    wrapper,
  });

  await waitFor(() => expect(getMyProfileMock).toHaveBeenCalled());

  return hook;
}

/** 그날 줄이 와서 칸이 바뀌기를 기다린다 — 역할까지 읽혀야 질의가 돈다. */
async function withOneRowOn(
  date: string,
  result: { current: { cellStateOf: (date: string) => string } },
): Promise<void> {
  await waitFor(() =>
    expect(result.current.cellStateOf(date)).toBe("admin-open"),
  );
}

describe("useRehearsalScreen — 역할이 읽는 질의를 가르고 시트 둘을 든다", () => {
  it("경로에 달이 없으면 오늘의 달을 본다", async () => {
    const { result } = await mounted();

    expect(result.current.month).toBe("2026-10");
  });

  it("경로의 달이 그 달을 정한다", async () => {
    const { result } = await mounted("2026-07");

    expect(result.current.month).toBe("2026-07");
    expect(result.current.monthYear).toBe(2026);
  });

  it("근무자는 자기 것만 읽는다", async () => {
    const { result } = await mounted();

    await waitFor(() => expect(getMyRehearsalsMock).toHaveBeenCalled());

    expect(result.current.isAdmin).toBe(false);
    expect(getAllRehearsalsMock).not.toHaveBeenCalled();
  });

  it("관리자는 전원 것을 읽고 넣는 길이 없다", async () => {
    getMyProfileMock.mockResolvedValue({ id: "boss", role: "admin" });

    const { result } = await mounted();

    await waitFor(() => expect(getAllRehearsalsMock).toHaveBeenCalled());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.openEdit).toBeUndefined();
    expect(getMyRehearsalsMock).not.toHaveBeenCalled();
  });

  it("달을 고르면 그 달을 읽고 열린 시트가 닫힌다", async () => {
    getMyRehearsalsMock.mockResolvedValue([rehearsalAt("a", "2026-10-05")]);

    const { result } = await mounted();

    await withOneRowOn("2026-10-05", result);

    act(() => result.current.openDay("2026-10-05"));
    expect(result.current.openDate).toBe("2026-10-05");

    act(() => result.current.pickMonth("2026-11"));

    expect(result.current.month).toBe("2026-11");
    expect(result.current.openDate).toBeNull();
    expect(result.current.form).toBeNull();
  });

  it("그날 수가 칸의 모습과 아래 글자를 정한다", async () => {
    getMyRehearsalsMock.mockResolvedValue([rehearsalAt("a", "2026-10-05")]);

    const { result } = await mounted();

    await withOneRowOn("2026-10-05", result);

    expect(result.current.noteOf("2026-10-05")).not.toBeNull();
    expect(result.current.cellStateOf("2026-10-06")).toBe("plain");
    expect(result.current.noteOf("2026-10-06")).toBeNull();
    expect(result.current.isToday(TODAY)).toBe(true);
  });

  it("읽기가 넘어지면 failed고 다시 시도가 다시 읽는다", async () => {
    getMyRehearsalsMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.failed).toBe(true));

    getMyRehearsalsMock.mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.failed).toBe(false));
  });

  it("넣기를 열면 폼이 서고 보낸 것이 그날로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openAdd());

    expect(result.current.form?.mode).toBe("add");

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

  it("보내고 나면 폼이 저절로 닫힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openAdd());
    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.form).toBeNull());
  });

  it("채우지 않은 폼은 안 보낸다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openAdd());
    act(() => result.current.submit());

    expect(addRehearsalMock).not.toHaveBeenCalled();
  });

  it("보내기가 넘어지면 폼이 열린 채로 안내를 든다", async () => {
    addRehearsalMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openAdd());
    act(() =>
      result.current.change({ startsAt: "14:00", endsAt: "16:00", count: "" }),
    );
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.sheet.notice).not.toBeNull());

    expect(result.current.form?.mode).toBe("add");
  });

  it("줄을 눌러 고치면 그 줄의 값이 폼에 실려 온다", async () => {
    getMyRehearsalsMock.mockResolvedValue([rehearsalAt("a", "2026-10-05")]);

    const { result } = await mounted();

    await withOneRowOn("2026-10-05", result);

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openEdit?.("a"));

    expect(result.current.form).toEqual({ mode: "edit", id: "a" });
    expect(result.current.sheet.values).toEqual({
      startsAt: "14:00",
      endsAt: "16:00",
      count: "",
    });
  });

  it("고친 것을 보내면 그 줄의 id로 간다", async () => {
    getMyRehearsalsMock.mockResolvedValue([rehearsalAt("a", "2026-10-05")]);

    const { result } = await mounted();

    await withOneRowOn("2026-10-05", result);

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openEdit?.("a"));
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

  it("없는 줄을 고치려 하면 폼이 안 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openEdit?.("없다"));

    expect(result.current.form).toBeNull();
  });

  it("지우기는 확인을 받고 지운 뒤 저절로 닫힌다", async () => {
    getMyRehearsalsMock.mockResolvedValue([rehearsalAt("a", "2026-10-05")]);

    const { result } = await mounted();

    await withOneRowOn("2026-10-05", result);

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openEdit?.("a"));

    expect(result.current.askRemove).toBeDefined();

    act(() => result.current.askRemove?.());
    expect(result.current.removing).toBe(true);

    act(() => result.current.confirmRemove());

    await waitFor(() =>
      expect(removeRehearsalMock).toHaveBeenCalledWith(FAKE_CLIENT, "a"),
    );
    await waitFor(() => expect(result.current.removing).toBe(false));

    expect(result.current.form).toBeNull();
  });

  it("넣기 폼에는 지우기가 없다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openAdd());

    expect(result.current.askRemove).toBeUndefined();
  });

  it("기기 뒤로가 위에 뜬 것만 닫는다 — 닫을 것이 없으면 안 가로챈다", async () => {
    const { result } = await mounted();

    expect(result.current.closeTop).toBeNull();

    act(() => result.current.openDay("2026-10-05"));
    act(() => result.current.openAdd());

    act(() => {
      result.current.closeTop?.();
    });
    expect(result.current.form).toBeNull();
    expect(result.current.openDate).toBe("2026-10-05");

    act(() => {
      result.current.closeTop?.();
    });
    expect(result.current.openDate).toBeNull();
    expect(result.current.closeTop).toBeNull();
  });
});
