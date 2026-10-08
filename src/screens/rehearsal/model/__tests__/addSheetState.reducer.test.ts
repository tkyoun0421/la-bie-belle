import {
  addSheetReducer,
  type AddSheetState,
} from "@/screens/rehearsal/model/addSheetState.reducer";

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
