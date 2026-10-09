import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import {
  CONFIRM_COPY,
  SHEET_COPY,
} from "@/screens/membersPending/consts/membersPending.const";
import { useMemberDetailSheet } from "@/screens/membersPending/hooks/useMemberDetailSheet";
import type { MemberDetailSheetInput } from "@/screens/membersPending/model/memberDetailSheet.type";

const VALUES: ProfilePrivate = {
  email: "bora@example.com",
  phone: "010-0000-0001",
  birthDate: "1998-03-14",
  gender: "female",
};

function inputFor(
  overrides: Partial<MemberDetailSheetInput> = {},
): MemberDetailSheetInput {
  return {
    name: "김보라",
    photoUrl: null,
    sentAt: "2026년 10월 1일 14:02에 보냈어요",
    values: VALUES,
    today: "2026-10-09",
    face: "detail",
    failed: false,
    onFace: jest.fn(),
    ...overrides,
  };
}

function sheetFor(overrides: Partial<MemberDetailSheetInput> = {}) {
  return renderHook(() => useMemberDetailSheet(inputFor(overrides)));
}

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
      (row) => row.label === SHEET_COPY.birthLabel,
    );

    expect(birth?.value).toBe("");
  });

  it("상세 면에서는 묻는 것이 없고 더보기가 보인다", () => {
    const { result } = sheetFor();

    expect(result.current.ask).toBeNull();
    expect(result.current.showMenu).toBe(true);
  });

  it("거절을 묻는 면은 물음과 까닭과 단추 문구를 완성해 준다", () => {
    const { result } = sheetFor({ face: "reject" });

    expect(result.current.ask).toEqual({
      question: `김보라${CONFIRM_COPY.reject.questionSuffix}`,
      note: CONFIRM_COPY.reject.note,
      confirmLabel: CONFIRM_COPY.reject.action,
      destructive: false,
    });
  });

  it("차단을 묻는 면은 되돌릴 수 없는 단추를 든다", () => {
    const { result } = sheetFor({ face: "block" });

    expect(result.current.ask).toEqual({
      question: `김보라${CONFIRM_COPY.block.questionSuffix}`,
      note: CONFIRM_COPY.block.note,
      confirmLabel: CONFIRM_COPY.block.action,
      destructive: true,
    });
  });

  it("묻는 면에서는 값 행이 없고 더보기가 숨는다", () => {
    const { result } = sheetFor({ face: "reject" });

    expect(result.current.valueRows).toEqual([]);
    expect(result.current.showMenu).toBe(false);
  });

  it("더보기를 누르면 팝오버가 닫히고 차단 면으로 간다", () => {
    const onFace = jest.fn();
    const { result } = sheetFor({ onFace });

    act(() => result.current.toggleMenu());
    expect(result.current.menuOpen).toBe(true);

    act(() => result.current.pressMenu());

    expect(result.current.menuOpen).toBe(false);
    expect(onFace).toHaveBeenCalledWith("block");
  });

  it("실패했으면 실패 줄을 준다", () => {
    expect(sheetFor().result.current.failedLine).toBeNull();
    expect(sheetFor({ failed: true }).result.current.failedLine).toBe(
      SHEET_COPY.sendFailed,
    );
  });
});
