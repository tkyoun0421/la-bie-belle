import { DomainError } from "@/shared/model/error.type";
import {
  addSheetReducer,
  type AddSheetState,
  addSheetActionFor,
  canSubmitForm,
} from "@/features/rehearsalEdit/model/addSheetState.reducer";

const BASE_STATE: AddSheetState = {
  formKind: "time",
  values: { startsAt: "14:00", endsAt: "16:00", count: "" },
  notice: null,
};

describe("addSheetReducer — wrong_kind는 갈래를 바꾸고 알림을 세운다", () => {
  it("갈래가 건수로 바뀌고 알림 문구가 선다", () => {
    const next = addSheetReducer(BASE_STATE, {
      type: "wrong_kind",
      kind: "count",
    });

    expect(next.formKind).toBe("count");
    expect(next.notice).toEqual({
      kind: "wrong_kind",
      message: "이 날의 근무가 바뀌었어요 · 다시 넣어주세요",
    });
  });

  it("넣던 값은 그대로 남는다", () => {
    const next = addSheetReducer(BASE_STATE, {
      type: "wrong_kind",
      kind: "count",
    });

    expect(next.values).toEqual(BASE_STATE.values);
  });
});

describe("addSheetReducer — overlaps는 값을 유지한 채 겹침 문구를 세운다", () => {
  it("겹침 문구가 정확히 선다", () => {
    const next = addSheetReducer(BASE_STATE, { type: "overlaps" });

    expect(next.notice).toEqual({
      kind: "overlaps",
      message: "이 시간에 넣은 리허설이 이미 있어요",
    });
  });

  it("넣던 값은 그대로 남는다", () => {
    const next = addSheetReducer(BASE_STATE, { type: "overlaps" });

    expect(next.values).toEqual(BASE_STATE.values);
  });
});

describe("addSheetReducer — 저장 실패(TransportError)는 값을 그대로 둔다", () => {
  it("넣던 값이 유지된다", () => {
    const next = addSheetReducer(BASE_STATE, { type: "transport_error" });

    expect(next.values).toEqual(BASE_STATE.values);
  });

  it("갈래는 안 바뀐다", () => {
    const next = addSheetReducer(BASE_STATE, { type: "transport_error" });

    expect(next.formKind).toBe(BASE_STATE.formKind);
  });
});

describe("addSheetActionFor — 실패를 시트 동작으로 옮긴다", () => {
  it("wrong_kind면 반대 갈래로 옮긴다", () => {
    expect(addSheetActionFor(new DomainError("wrong_kind"), "time")).toEqual({
      type: "wrong_kind",
      kind: "count",
    });
    expect(addSheetActionFor(new DomainError("wrong_kind"), "count")).toEqual({
      type: "wrong_kind",
      kind: "time",
    });
  });

  it("overlaps면 겹침 동작이다", () => {
    expect(addSheetActionFor(new DomainError("overlaps"), "time")).toEqual({
      type: "overlaps",
    });
  });

  it("다른 업무 오류나 통신 오류는 통신 실패 동작이다", () => {
    expect(
      addSheetActionFor(new DomainError("already_exists"), "time"),
    ).toEqual({ type: "transport_error" });
    expect(addSheetActionFor(new Error("network"), "time")).toEqual({
      type: "transport_error",
    });
  });
});

describe("canSubmitForm — 갈래마다 채워진 값만 제출할 수 있다", () => {
  it("시간 갈래는 시작과 끝이 다섯 글자면 가능하다", () => {
    expect(canSubmitForm(BASE_STATE)).toBe(true);
  });

  it("시간 갈래는 시작이 덜 찼으면 불가능하다", () => {
    expect(
      canSubmitForm({
        ...BASE_STATE,
        values: { ...BASE_STATE.values, startsAt: "14:0" },
      }),
    ).toBe(false);
  });

  it("횟수 갈래는 하나에서 아홉 사이 정수면 가능하다", () => {
    const countState = (count: string): AddSheetState => ({
      ...BASE_STATE,
      formKind: "count",
      values: { startsAt: "", endsAt: "", count },
    });

    expect(canSubmitForm(countState("1"))).toBe(true);
    expect(canSubmitForm(countState("9"))).toBe(true);
    expect(canSubmitForm(countState("0"))).toBe(false);
    expect(canSubmitForm(countState("10"))).toBe(false);
    expect(canSubmitForm(countState("1.5"))).toBe(false);
    expect(canSubmitForm(countState(""))).toBe(false);
  });
});
