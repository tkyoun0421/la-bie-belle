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

const { renderHook, act } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { MEMBER_SHEET_COPY } =
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

const LEFT_AT = "2026-09-30";
const ERASED_AT = "2027-01-01T00:00:00Z";

function sheetIn({
  renaming,
  erased,
  left,
}: {
  renaming: boolean;
  erased: boolean;
  left: boolean;
}) {
  const sheet = sheetFor({
    member: {
      ...MEMBER,
      leftAt: left ? LEFT_AT : null,
      erasedAt: erased ? ERASED_AT : null,
    },
  });

  if (renaming) {
    act(() => sheet.result.current.showFace("rename"));
  }

  return sheet.result.current;
}

describe("useMemberSheet — 본문과 바닥과 메뉴 라벨의 우선순위", () => {
  it("셋 다 거짓이면 본문과 바닥이 상세고 메뉴는 퇴사 처리다", () => {
    const sheet = sheetIn({ renaming: false, erased: false, left: false });

    expect(sheet.body).toBe("detail");
    expect(sheet.footer).toBe("detail");
    expect(sheet.menuLabel).toBe(MEMBER_SHEET_COPY.markLeave);
  });

  it("renaming이 erased를 이겨 본문이 rename이다", () => {
    const sheet = sheetIn({ renaming: true, erased: true, left: false });

    expect(sheet.body).toBe("rename");
  });

  it("renaming이 left를 이겨 바닥이 rename이다", () => {
    const sheet = sheetIn({ renaming: true, erased: false, left: true });

    expect(sheet.footer).toBe("rename");
  });

  it("erased만 참이면 본문이 none이고 바닥은 상세다", () => {
    const sheet = sheetIn({ renaming: false, erased: true, left: false });

    expect(sheet.body).toBe("none");
    expect(sheet.footer).toBe("detail");
  });

  it("left만 참이면 바닥이 none이고 본문은 상세다", () => {
    const sheet = sheetIn({ renaming: false, erased: false, left: true });

    expect(sheet.body).toBe("detail");
    expect(sheet.footer).toBe("none");
  });

  it("erased와 left가 둘 다 참이면 본문과 바닥이 모두 none이다", () => {
    const sheet = sheetIn({ renaming: false, erased: true, left: true });

    expect(sheet.body).toBe("none");
    expect(sheet.footer).toBe("none");
  });

  it("셋이 모두 참이면 본문과 바닥이 rename이다", () => {
    const sheet = sheetIn({ renaming: true, erased: true, left: true });

    expect(sheet.body).toBe("rename");
    expect(sheet.footer).toBe("rename");
  });

  it("left만 참이면 메뉴 라벨이 퇴사 되돌리기다", () => {
    const sheet = sheetIn({ renaming: false, erased: false, left: true });

    expect(sheet.menuLabel).toBe(MEMBER_SHEET_COPY.undoLeave);
  });

  it("erased가 left를 이겨 메뉴 라벨이 없다", () => {
    const sheet = sheetIn({ renaming: false, erased: true, left: true });

    expect(sheet.menuLabel).toBeNull();
  });

  it("renaming이 left를 이겨 메뉴 라벨이 없다", () => {
    const sheet = sheetIn({ renaming: true, erased: false, left: true });

    expect(sheet.menuLabel).toBeNull();
  });

  it("renaming과 erased가 겹쳐도 메뉴 라벨이 없다", () => {
    const sheet = sheetIn({ renaming: true, erased: true, left: false });

    expect(sheet.menuLabel).toBeNull();
  });

  it("셋이 모두 참이어도 메뉴 라벨이 없다", () => {
    const sheet = sheetIn({ renaming: true, erased: true, left: true });

    expect(sheet.menuLabel).toBeNull();
  });
});
