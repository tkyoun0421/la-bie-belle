import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { openPhone } from "@/shared/lib/openPhone.lib";
import type { Member } from "@/entities/member/model/member.type";
import type { MemberSheetInput } from "@/features/memberAdmin/model/memberSheet.type";

const openPhoneMock = jest.fn<typeof openPhone>();
const setDisplayNameMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setRoleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const markLeaveMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const undoLeaveMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/lib/openPhone.lib", () => ({
  openPhone: openPhoneMock,
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/memberAdmin/api/setDisplayName.api",
  () => ({ setDisplayName: setDisplayNameMock }),
);

jest.unstable_mockModule("@/features/memberAdmin/api/setRole.api", () => ({
  setRole: setRoleMock,
}));

jest.unstable_mockModule("@/features/memberAdmin/api/markLeave.api", () => ({
  markLeave: markLeaveMock,
}));

jest.unstable_mockModule("@/features/memberAdmin/api/undoLeave.api", () => ({
  undoLeave: undoLeaveMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { MEMBER_SHEET_COPY, MEMBER_SHEET_TOAST } =
  await import("@/features/memberAdmin/consts/memberAdmin.const");
const { useMemberSheet } =
  await import("@/features/memberAdmin/hooks/useMemberSheet");

const MEMBER: Member = {
  id: "member-1",
  displayName: "김보라",
  photoUrl: null,
  submittedAt: "2026-01-02T00:00:00Z",
  approvedAt: "2026-01-03T00:00:00Z",
  rejectedAt: null,
  blockedAt: null,
  role: "worker",
  leftAt: null,
  erasedAt: null,
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

function inputFor(overrides: Partial<MemberSheetInput> = {}): MemberSheetInput {
  return {
    member: MEMBER,
    today: "2026-10-09",
    lastAdmin: false,
    reachLine: null,
    onDone: jest.fn(),
    ...overrides,
  };
}

function sheetFor(overrides: Partial<MemberSheetInput> = {}) {
  const { wrapper } = createWrapper();

  return renderHook(() => useMemberSheet(inputFor(overrides)), { wrapper });
}

beforeEach(() => {
  openPhoneMock.mockClear();
  setDisplayNameMock.mockReset();
  setRoleMock.mockReset();
  markLeaveMock.mockReset();
  undoLeaveMock.mockReset();

  setDisplayNameMock.mockResolvedValue(undefined);
  setRoleMock.mockResolvedValue(undefined);
  markLeaveMock.mockResolvedValue(undefined);
  undoLeaveMock.mockResolvedValue(undefined);
});

describe("useMemberSheet — 시트가 그릴 값을 완성해 준다", () => {
  it("이름이 없으면 빈 문자열을 준다", () => {
    const { result } = sheetFor({ member: { ...MEMBER, displayName: null } });

    expect(result.current.name).toBe("");
  });

  it("상세 면의 값 행 셋을 완성된 문자열로 준다", () => {
    const { result } = sheetFor();
    const values = result.current.valueRows.map((row) => row.value);

    expect(values).toEqual(["010-0000-0001", "여성", "1998년 3월 14일(28세)"]);
  });

  it("생년월일이 없으면 그 행의 값이 빈 문자열이다", () => {
    const { result } = sheetFor({ member: { ...MEMBER, birthDate: null } });
    const birth = result.current.valueRows.find(
      (row) => row.label === MEMBER_SHEET_COPY.birthLabel,
    );

    expect(birth?.value).toBe("");
  });

  it("연락처 행을 누르면 전화를 건다", () => {
    const { result } = sheetFor();
    const phone = result.current.valueRows.find(
      (row) => row.label === MEMBER_SHEET_COPY.phoneLabel,
    );

    act(() => phone?.press?.());

    expect(openPhoneMock).toHaveBeenCalledWith("010-0000-0001");
  });

  it("연락처가 없으면 그 행을 누를 수 없다", () => {
    const { result } = sheetFor({ member: { ...MEMBER, phone: null } });
    const phone = result.current.valueRows.find(
      (row) => row.label === MEMBER_SHEET_COPY.phoneLabel,
    );

    expect(phone?.press).toBeNull();
  });

  it("지워진 회원은 값 행이 없다", () => {
    const { result } = sheetFor({
      member: { ...MEMBER, erasedAt: "2027-01-01T00:00:00Z" },
    });

    expect(result.current.body).toBe("none");
    expect(result.current.valueRows).toEqual([]);
    expect(result.current.erasedLine).toBe(MEMBER_SHEET_COPY.erased);
  });

  it("퇴사한 회원은 퇴사 줄을 완성해 준다", () => {
    const { result } = sheetFor({
      member: { ...MEMBER, leftAt: "2026-09-30" },
    });

    expect(result.current.leftLine).toContain(MEMBER_SHEET_COPY.leftSuffix);
  });

  it("퇴사하지 않았으면 퇴사 줄이 없다", () => {
    const { result } = sheetFor();

    expect(result.current.leftLine).toBeNull();
  });

  it("더보기가 퇴사 여부에 따라 다른 문구를 든다", () => {
    const { result } = sheetFor();
    expect(result.current.menuLabel).toBe(MEMBER_SHEET_COPY.markLeave);

    const left = sheetFor({ member: { ...MEMBER, leftAt: "2026-09-30" } });
    expect(left.result.current.menuLabel).toBe(MEMBER_SHEET_COPY.undoLeave);
  });

  it("더보기를 누르면 퇴사 여부에 맞는 확인창이 선다", () => {
    const { result } = sheetFor();

    act(() => result.current.pressMenu());

    expect(result.current.dialog).toBe("leave");
  });

  it("퇴사한 회원의 더보기는 되돌리기를 묻는다", () => {
    const { result } = sheetFor({
      member: { ...MEMBER, leftAt: "2026-09-30" },
    });

    act(() => result.current.pressMenu());

    expect(result.current.dialog).toBe("undo");
  });

  it("더보기를 누르면 팝오버가 닫힌다", () => {
    const { result } = sheetFor();

    act(() => result.current.toggleMenu());
    expect(result.current.menuOpen).toBe(true);

    act(() => result.current.pressMenu());
    expect(result.current.menuOpen).toBe(false);
  });

  it("이름을 고치는 중이면 더보기가 없다", () => {
    const { result } = sheetFor();

    act(() => result.current.showFace("rename"));

    expect(result.current.menuLabel).toBeNull();
  });

  it("지워진 회원은 더보기가 없다", () => {
    const { result } = sheetFor({
      member: { ...MEMBER, erasedAt: "2027-01-01T00:00:00Z" },
    });

    expect(result.current.menuLabel).toBeNull();
  });

  it("이름이 그대로면 저장할 수 없다", () => {
    const { result } = sheetFor();

    act(() => result.current.showFace("rename"));

    expect(result.current.draft).toBe("김보라");
    expect(result.current.canSave).toBe(false);
  });

  it("이름을 바꿨으면 저장할 수 있다", () => {
    const { result } = sheetFor();

    act(() => result.current.showFace("rename"));
    act(() => result.current.writeDraft("김보라나"));

    expect(result.current.canSave).toBe(true);
  });

  it("관리자면 내리기 문구를 든다", () => {
    const { result } = sheetFor({ member: { ...MEMBER, role: "admin" } });

    expect(result.current.roleLabel).toBe(MEMBER_SHEET_COPY.demote);
    expect(result.current.showAdminBadge).toBe(true);
  });

  it("관리자가 혼자면 역할을 바꿀 수 없고 까닭을 든다", () => {
    const { result } = sheetFor({
      member: { ...MEMBER, role: "admin" },
      lastAdmin: true,
    });

    expect(result.current.roleDisabled).toBe(true);
    expect(result.current.lastAdminNote).toBe(MEMBER_SHEET_COPY.lastAdminNote);
  });

  it("관리자가 아니면 혼자여도 역할을 바꿀 수 있다", () => {
    const { result } = sheetFor({ lastAdmin: true });

    expect(result.current.roleDisabled).toBe(false);
    expect(result.current.lastAdminNote).toBeNull();
  });

  it("면마다 몸과 바닥이 갈린다", () => {
    expect(sheetFor().result.current.body).toBe("detail");
    expect(sheetFor().result.current.footer).toBe("detail");

    const renaming = sheetFor();
    act(() => renaming.result.current.showFace("rename"));
    expect(renaming.result.current.body).toBe("rename");
    expect(renaming.result.current.footer).toBe("rename");

    const left = sheetFor({ member: { ...MEMBER, leftAt: "2026-09-30" } });
    expect(left.result.current.footer).toBe("none");
  });

  it("실패하기 전에는 실패 줄이 없다", () => {
    expect(sheetFor().result.current.failedLine).toBeNull();
  });
});

describe("useMemberSheet — 조각이 쓰기 넷을 든다", () => {
  it("이름을 고쳐 저장하면 그 사람 id로 가고 끝났다고 알린다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.showFace("rename"));
    act(() => result.current.writeDraft("김보라나"));
    act(() => result.current.saveName());

    await waitFor(() =>
      expect(setDisplayNameMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "member-1",
        "김보라나",
      ),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: MEMBER_SHEET_TOAST.nameChanged,
      }),
    );
  });

  it("관리자로 올리기는 확인을 받고 역할을 보낸다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.askRole());

    expect(result.current.dialog).toBe("promote");

    act(() => result.current.confirm());

    await waitFor(() =>
      expect(setRoleMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "member-1",
        "admin",
      ),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: MEMBER_SHEET_TOAST.promoted,
      }),
    );
  });

  it("퇴사 처리는 확인을 받고 그 사람 id로 간다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.pressMenu());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(markLeaveMock).toHaveBeenCalledWith(FAKE_CLIENT, "member-1"),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: MEMBER_SHEET_TOAST.leaveDone,
      }),
    );
  });

  it("퇴사 되돌리기도 같은 꼴이다", async () => {
    const onDone = jest.fn();
    const { result } = sheetFor({
      member: { ...MEMBER, leftAt: "2026-09-30" },
      onDone,
    });

    act(() => result.current.pressMenu());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(undoLeaveMock).toHaveBeenCalledWith(FAKE_CLIENT, "member-1"),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "success",
        message: MEMBER_SHEET_TOAST.undoDone,
      }),
    );
  });

  it("앞으로 배정이 남았다고 거절당하면 그 Dialog가 선다", async () => {
    markLeaveMock.mockRejectedValue(new DomainError("has_future_assignments"));

    const { result } = sheetFor();

    act(() => result.current.pressMenu());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.dialog).toBe("blocked"));

    expect(result.current.failedLine).toBeNull();
  });

  it("마지막 관리자라고 거절당하면 그 Dialog가 선다", async () => {
    setRoleMock.mockRejectedValue(new DomainError("last_admin"));

    const { result } = sheetFor();

    act(() => result.current.askRole());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.dialog).toBe("last-admin"));
  });

  it("이미 처리된 사람이면 그렇다고 알린다", async () => {
    markLeaveMock.mockRejectedValue(new DomainError("already_decided"));

    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.pressMenu());
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({
        kind: "info",
        message: MEMBER_SHEET_TOAST.alreadyDecided,
      }),
    );
  });

  it("통신이 끊긴 것은 시트에 실패 줄을 세운다", async () => {
    setDisplayNameMock.mockRejectedValue(new Error("끊겼다"));

    const onDone = jest.fn();
    const { result } = sheetFor({ onDone });

    act(() => result.current.showFace("rename"));
    act(() => result.current.writeDraft("김보라나"));
    act(() => result.current.saveName());

    await waitFor(() =>
      expect(result.current.failedLine).toBe(MEMBER_SHEET_COPY.sendFailed),
    );

    expect(onDone).not.toHaveBeenCalled();
  });

  it("확인창을 닫으면 거절도 걷힌다", async () => {
    setRoleMock.mockRejectedValue(new DomainError("last_admin"));

    const { result } = sheetFor();

    act(() => result.current.askRole());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.dialog).toBe("last-admin"));

    act(() => result.current.closeDialog());

    expect(result.current.dialog).toBeNull();
  });
});
