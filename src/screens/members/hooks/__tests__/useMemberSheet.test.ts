import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import type { openPhone } from "@/shared/lib/openPhone.lib";
import type { Member } from "@/entities/member/model/member.type";
import { MEMBER_SHEET_COPY } from "@/screens/members/consts/members.const";
import type { MemberSheetInput } from "@/screens/members/model/memberSheet.type";

const openPhoneMock = jest.fn<typeof openPhone>();

jest.unstable_mockModule("@/shared/lib/openPhone.lib", () => ({
  openPhone: openPhoneMock,
}));

const { useMemberSheet } =
  await import("@/screens/members/hooks/useMemberSheet");

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

function inputFor(overrides: Partial<MemberSheetInput> = {}): MemberSheetInput {
  return {
    member: MEMBER,
    today: "2026-10-09",
    lastAdmin: false,
    reachLine: null,
    face: "detail",
    draft: "",
    failed: false,
    onMarkLeave: jest.fn(),
    onUndoLeave: jest.fn(),
    ...overrides,
  };
}

function sheetFor(overrides: Partial<MemberSheetInput> = {}) {
  return renderHook(() => useMemberSheet(inputFor(overrides)));
}

describe("useMemberSheet — 시트가 그릴 값을 완성해 준다", () => {
  beforeEach(() => {
    openPhoneMock.mockClear();
  });

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

  it("더보기를 누르면 퇴사 여부에 맞는 쪽을 부른다", () => {
    const onMarkLeave = jest.fn();
    const onUndoLeave = jest.fn();
    const { result } = sheetFor({ onMarkLeave, onUndoLeave });

    act(() => result.current.pressMenu());

    expect(onMarkLeave).toHaveBeenCalledTimes(1);
    expect(onUndoLeave).not.toHaveBeenCalled();
  });

  it("퇴사한 회원의 더보기는 되돌리기를 부른다", () => {
    const onMarkLeave = jest.fn();
    const onUndoLeave = jest.fn();
    const { result } = sheetFor({
      member: { ...MEMBER, leftAt: "2026-09-30" },
      onMarkLeave,
      onUndoLeave,
    });

    act(() => result.current.pressMenu());

    expect(onUndoLeave).toHaveBeenCalledTimes(1);
    expect(onMarkLeave).not.toHaveBeenCalled();
  });

  it("더보기를 누르면 팝오버가 닫힌다", () => {
    const { result } = sheetFor();

    act(() => result.current.toggleMenu());
    expect(result.current.menuOpen).toBe(true);

    act(() => result.current.pressMenu());
    expect(result.current.menuOpen).toBe(false);
  });

  it("이름을 고치는 중이면 더보기가 없다", () => {
    const { result } = sheetFor({ face: "rename" });

    expect(result.current.menuLabel).toBeNull();
  });

  it("지워진 회원은 더보기가 없다", () => {
    const { result } = sheetFor({
      member: { ...MEMBER, erasedAt: "2027-01-01T00:00:00Z" },
    });

    expect(result.current.menuLabel).toBeNull();
  });

  it("이름이 그대로면 저장할 수 없다", () => {
    const { result } = sheetFor({ face: "rename", draft: "김보라" });

    expect(result.current.canSave).toBe(false);
  });

  it("이름을 바꿨으면 저장할 수 있다", () => {
    const { result } = sheetFor({ face: "rename", draft: "김보라나" });

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

    const renaming = sheetFor({ face: "rename" });
    expect(renaming.result.current.body).toBe("rename");
    expect(renaming.result.current.footer).toBe("rename");

    const left = sheetFor({ member: { ...MEMBER, leftAt: "2026-09-30" } });
    expect(left.result.current.footer).toBe("none");
  });

  it("실패했으면 실패 줄을 준다", () => {
    expect(sheetFor().result.current.failedLine).toBeNull();
    expect(sheetFor({ failed: true }).result.current.failedLine).toBe(
      MEMBER_SHEET_COPY.sendFailed,
    );
  });
});
