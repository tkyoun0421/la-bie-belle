import { MEMBER_SHEET_COPY } from "@/features/memberAdmin/consts/memberAdmin.const";

const { memberSheetVisuals } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/features/memberAdmin/model/memberSheetVisuals.policy"
);

describe("memberSheetVisuals — 시트의 면마다 몸과 바닥과 더보기", () => {
  it("재직 회원의 상세 면은 몸·바닥이 상세고 더보기가 퇴사 처리다", () => {
    expect(
      memberSheetVisuals({ renaming: false, erased: false, left: false }),
    ).toEqual({
      body: "detail",
      footer: "detail",
      menuLabel: MEMBER_SHEET_COPY.markLeave,
    });
  });

  it("퇴사한 회원은 바닥이 없고 더보기가 되돌리기다", () => {
    expect(
      memberSheetVisuals({ renaming: false, erased: false, left: true }),
    ).toEqual({
      body: "detail",
      footer: "none",
      menuLabel: MEMBER_SHEET_COPY.undoLeave,
    });
  });

  it("지워진 회원은 몸이 없고 더보기도 없다", () => {
    expect(
      memberSheetVisuals({ renaming: false, erased: true, left: false }),
    ).toEqual({ body: "none", footer: "detail", menuLabel: null });
  });

  it("지워진 퇴사 회원은 몸도 바닥도 없다", () => {
    expect(
      memberSheetVisuals({ renaming: false, erased: true, left: true }),
    ).toEqual({ body: "none", footer: "none", menuLabel: null });
  });

  it("이름을 고치는 중이면 몸과 바닥이 고치기고 더보기가 없다", () => {
    expect(
      memberSheetVisuals({ renaming: true, erased: false, left: false }),
    ).toEqual({ body: "rename", footer: "rename", menuLabel: null });
  });

  it("이름을 고치는 중이면 퇴사·삭제 여부와 상관없이 고치기 면이다", () => {
    expect(
      memberSheetVisuals({ renaming: true, erased: true, left: true }),
    ).toEqual({ body: "rename", footer: "rename", menuLabel: null });
  });
});
