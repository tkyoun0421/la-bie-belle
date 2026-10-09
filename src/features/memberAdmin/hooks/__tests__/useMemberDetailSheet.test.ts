import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import type { MemberDetailSheetInput } from "@/features/memberAdmin/model/memberDetailSheet.type";

const approveMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const rejectMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const blockMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/memberAdmin/api/approveMember.api",
  () => ({ approveMember: approveMemberMock }),
);

jest.unstable_mockModule("@/features/memberAdmin/api/rejectMember.api", () => ({
  rejectMember: rejectMemberMock,
}));

jest.unstable_mockModule("@/features/memberAdmin/api/blockMember.api", () => ({
  blockMember: blockMemberMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { DECISION_COPY, DETAIL_SHEET_COPY, DETAIL_SHEET_TOAST } =
  await import("@/features/memberAdmin/consts/memberAdmin.const");
const { useMemberDetailSheet } =
  await import("@/features/memberAdmin/hooks/useMemberDetailSheet");

const VALUES: ProfilePrivate = {
  email: "bora@example.com",
  phone: "010-0000-0001",
  birthDate: "1998-03-14",
  gender: "female",
};

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

function inputFor(
  overrides: Partial<MemberDetailSheetInput> = {},
): MemberDetailSheetInput {
  return {
    profileId: "p1",
    name: "김보라",
    photoUrl: null,
    sentAt: "2026년 10월 1일 14:02에 보냈어요",
    values: VALUES,
    today: "2026-10-09",
    onDone: jest.fn(),
    ...overrides,
  };
}

function sheetFor(overrides: Partial<MemberDetailSheetInput> = {}) {
  const { wrapper } = createWrapper();

  return renderHook(() => useMemberDetailSheet(inputFor(overrides)), {
    wrapper,
  });
}

beforeEach(() => {
  approveMemberMock.mockReset();
  rejectMemberMock.mockReset();
  blockMemberMock.mockReset();

  approveMemberMock.mockResolvedValue(undefined);
  rejectMemberMock.mockResolvedValue(undefined);
  blockMemberMock.mockResolvedValue(undefined);
});

describe("useMemberDetailSheet — 시트가 그릴 값을 완성해 준다", () => {
  it("상세 면의 값 행 넷을 완성된 문자열로 준다", () => {
    const { result } = sheetFor();

    expect(result.current.valueRows.map((row) => row.value)).toEqual([
      "여성",
      "1998년 3월 14일(28세)",
      "010-0000-0001",
      "bora@example.com",
    ]);
  });

  it("비공개 값을 아직 못 받았으면 행이 전부 빈 문자열이다", () => {
    const { result } = sheetFor({ values: null });

    expect(result.current.valueRows.map((row) => row.value)).toEqual([
      "",
      "",
      "",
      "",
    ]);
  });

  it("생년월일이 없으면 그 행만 빈 문자열이다", () => {
    const { result } = sheetFor({ values: { ...VALUES, birthDate: null } });
    const birth = result.current.valueRows.find(
      (row) => row.label === DETAIL_SHEET_COPY.birthLabel,
    );

    expect(birth?.value).toBe("");
  });

  it("상세 면에서는 묻는 것이 없고 더보기가 보인다", () => {
    const { result } = sheetFor();

    expect(result.current.ask).toBeNull();
    expect(result.current.showMenu).toBe(true);
  });

  it("거절을 묻는 면은 물음과 까닭과 단추 문구를 완성해 준다", () => {
    const { result } = sheetFor();

    act(() => result.current.showFace("reject"));

    expect(result.current.ask).toEqual({
      question: `김보라${DECISION_COPY.reject.questionSuffix}`,
      note: DECISION_COPY.reject.note,
      confirmLabel: DECISION_COPY.reject.action,
      destructive: false,
    });
  });

  it("차단을 묻는 면은 되돌릴 수 없는 단추를 든다", () => {
    const { result } = sheetFor();

    act(() => result.current.showFace("block"));

    expect(result.current.ask).toEqual({
      question: `김보라${DECISION_COPY.block.questionSuffix}`,
      note: DECISION_COPY.block.note,
      confirmLabel: DECISION_COPY.block.action,
      destructive: true,
    });
  });

  it("묻는 면에서는 값 행이 없고 더보기가 숨는다", () => {
    const { result } = sheetFor();

    act(() => result.current.showFace("reject"));

    expect(result.current.valueRows).toEqual([]);
    expect(result.current.showMenu).toBe(false);
  });

  it("더보기를 누르면 팝오버가 닫히고 차단 면으로 간다", () => {
    const { result } = sheetFor();

    act(() => result.current.toggleMenu());
    expect(result.current.menuOpen).toBe(true);

    act(() => result.current.pressMenu());

    expect(result.current.menuOpen).toBe(false);
    expect(result.current.ask?.confirmLabel).toBe(DECISION_COPY.block.action);
  });

  it("실패하기 전에는 실패 줄이 없다", () => {
    expect(sheetFor().result.current.failedLine).toBeNull();
  });
});

describe("useMemberDetailSheet — 조각이 판정 셋을 든다", () => {
  it("승인하면 그 사람 id로 가고 이름이 든 토스트를 알린다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.approve());

    await waitFor(() =>
      expect(approveMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: `김보라${DETAIL_SHEET_TOAST.approvedSuffix}`,
      }),
    );
  });

  it("거절은 얼굴을 바꿔 묻고 확인하면 보낸다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.showFace("reject"));
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(rejectMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: `김보라${DETAIL_SHEET_TOAST.rejectedSuffix}`,
      }),
    );
  });

  it("차단도 같은 꼴이다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.showFace("block"));
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(blockMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1"),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: `김보라${DETAIL_SHEET_TOAST.blockedSuffix}`,
      }),
    );
  });

  it("상세 얼굴에서 확인을 눌러도 아무것도 안 보낸다", () => {
    const { result } = sheetFor();

    act(() => result.current.confirm());

    expect(rejectMemberMock).not.toHaveBeenCalled();
    expect(blockMemberMock).not.toHaveBeenCalled();
  });

  it("늦게 누르면 안내 토스트를 알린다", async () => {
    approveMemberMock.mockRejectedValue(new DomainError("already_decided"));

    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.approve());

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "info",
        message: DETAIL_SHEET_TOAST.alreadyDecided,
      }),
    );
  });

  it("통신이 끊기면 실패 줄을 세우고 끝났다고 알리지 않는다", async () => {
    approveMemberMock.mockRejectedValue(new Error("끊겼다"));

    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.approve());

    await waitFor(() =>
      expect(result.current.failedLine).toBe(DETAIL_SHEET_COPY.sendFailed),
    );

    expect(onDone).not.toHaveBeenCalled();
  });
});
