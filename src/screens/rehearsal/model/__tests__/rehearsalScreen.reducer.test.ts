const { initialRehearsalScreenState, rehearsalScreenReducer } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/rehearsal/model/rehearsalScreen.reducer"
);

const BROWSING = { kind: "browsing", month: "2026-10", pickerYear: null };

const DAY = {
  kind: "day",
  month: "2026-10",
  pickerYear: null,
  openDate: "2026-10-12",
};

const ADD_FORM = {
  kind: "form",
  month: "2026-10",
  pickerYear: null,
  openDate: "2026-10-12",
  form: { mode: "add" },
};

describe("rehearsalScreenReducer — 초기 상태", () => {
  it("받은 달로 열린 것 없이 선다", () => {
    expect(initialRehearsalScreenState("2026-10")).toEqual({
      kind: "browsing",
      month: "2026-10",
      pickerYear: null,
    });
  });
});

describe("rehearsalScreenReducer — 날", () => {
  it("열린 것이 없을 때 날을 열면 day가 선다", () => {
    const next = rehearsalScreenReducer(BROWSING, {
      type: "open_day",
      date: "2026-10-12",
    });

    expect(next).toEqual(DAY);
  });

  it("날이 열린 채 다른 날을 열면 날만 바뀐다", () => {
    const next = rehearsalScreenReducer(DAY, {
      type: "open_day",
      date: "2026-10-13",
    });

    expect(next).toEqual({ ...DAY, openDate: "2026-10-13" });
  });

  it("폼이 열린 채 다른 날을 열면 폼은 그대로고 날만 바뀐다", () => {
    const next = rehearsalScreenReducer(ADD_FORM, {
      type: "open_day",
      date: "2026-10-13",
    });

    expect(next).toEqual({ ...ADD_FORM, openDate: "2026-10-13" });
  });

  it("날을 닫으면 열린 것이 없는 가지로 돌아온다", () => {
    const next = rehearsalScreenReducer(DAY, { type: "close_day" });

    expect(next).toEqual(BROWSING);
  });

  it("폼이 열린 채 날을 닫으면 날과 폼이 둘 다 남지 않는다", () => {
    const next = rehearsalScreenReducer(ADD_FORM, { type: "close_day" });

    expect(next).toEqual(BROWSING);
  });

  it("열린 것이 없을 때 날을 닫아도 그대로다", () => {
    const next = rehearsalScreenReducer(BROWSING, { type: "close_day" });

    expect(next).toEqual(BROWSING);
  });
});

describe("rehearsalScreenReducer — 폼", () => {
  it("날이 열렸을 때 추가 폼을 열면 form 가지가 선다", () => {
    const next = rehearsalScreenReducer(DAY, {
      type: "open_form",
      form: { mode: "add" },
    });

    expect(next).toEqual(ADD_FORM);
  });

  it("날이 열렸을 때 고치기 폼을 열면 그 id를 든다", () => {
    const next = rehearsalScreenReducer(DAY, {
      type: "open_form",
      form: { mode: "edit", id: "rehearsal-1" },
    });

    expect(next).toEqual({
      ...ADD_FORM,
      form: { mode: "edit", id: "rehearsal-1" },
    });
  });

  it("폼이 열린 채 다른 폼을 열면 폼이 바뀐다", () => {
    const next = rehearsalScreenReducer(ADD_FORM, {
      type: "open_form",
      form: { mode: "edit", id: "rehearsal-1" },
    });

    expect(next).toEqual({
      ...ADD_FORM,
      form: { mode: "edit", id: "rehearsal-1" },
    });
  });

  it("열린 날이 없으면 폼을 열어도 상태가 바뀌지 않는다", () => {
    const next = rehearsalScreenReducer(BROWSING, {
      type: "open_form",
      form: { mode: "add" },
    });

    expect(next).toEqual(BROWSING);
  });

  it("폼을 닫으면 날은 열린 채 폼만 사라진다", () => {
    const next = rehearsalScreenReducer(ADD_FORM, { type: "close_form" });

    expect(next).toEqual(DAY);
  });

  it("폼이 없을 때 폼을 닫아도 그대로다", () => {
    const next = rehearsalScreenReducer(DAY, { type: "close_form" });

    expect(next).toEqual(DAY);
  });
});

describe("rehearsalScreenReducer — 달 고르기", () => {
  it("달을 고르면 열린 날·폼·연 고르개가 전부 사라진다", () => {
    const state = { ...ADD_FORM, pickerYear: 2026 };

    const next = rehearsalScreenReducer(state, {
      type: "pick_month",
      month: "2026-11",
    });

    expect(next).toEqual({
      kind: "browsing",
      month: "2026-11",
      pickerYear: null,
    });
  });

  it("달을 따라가면 달만 바뀌고 열린 날·폼·연 고르개는 그대로다", () => {
    const state = { ...ADD_FORM, pickerYear: 2026 };

    const next = rehearsalScreenReducer(state, {
      type: "follow_month",
      month: "2026-12",
    });

    expect(next).toEqual({ ...state, month: "2026-12" });
  });
});

describe("rehearsalScreenReducer — 연 고르개", () => {
  it("고르개를 열면 받은 해가 선다", () => {
    const next = rehearsalScreenReducer(DAY, {
      type: "open_picker",
      year: 2026,
    });

    expect(next).toEqual({ ...DAY, pickerYear: 2026 });
  });

  it("해를 바꾸면 pickerYear만 바뀐다", () => {
    const state = { ...ADD_FORM, pickerYear: 2026 };

    const next = rehearsalScreenReducer(state, {
      type: "change_picker_year",
      year: 2027,
    });

    expect(next).toEqual({ ...state, pickerYear: 2027 });
  });

  it("고르개를 닫으면 pickerYear만 비고 열린 날과 폼은 그대로다", () => {
    const state = { ...ADD_FORM, pickerYear: 2026 };

    const next = rehearsalScreenReducer(state, { type: "close_picker" });

    expect(next).toEqual(ADD_FORM);
  });
});
