const { UNSEEDED_PENDING_FORM, pendingFormReducer } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/pending/model/pendingForm.reducer"
);

const STEPS = ["photo", "name", "gender", "birthDate", "phone"];

const SEEDED_VALUES = {
  name: "가짜이름",
  gender: "female",
  birthDate: "19900101",
  phone: "01000000001",
};

const EMPTY_VALUES = { name: "", gender: null, birthDate: "", phone: "" };

const SEEDED_EMPTY = {
  kind: "seeded",
  values: EMPTY_VALUES,
  frozen: [],
  everSubmitted: false,
};

describe("pendingFormReducer — 초기 상태", () => {
  it("씨를 뿌리기 전에는 값도 얼린 칸도 제출 기록도 들지 않는다", () => {
    expect(UNSEEDED_PENDING_FORM).toEqual({ kind: "unseeded" });
  });
});

describe("pendingFormReducer — 씨를 뿌린다", () => {
  it("이미 답한 사람이면 값을 채우고 모든 칸을 얼리며 제출한 적 있다고 적는다", () => {
    const next = pendingFormReducer(UNSEEDED_PENDING_FORM, {
      type: "seed",
      values: SEEDED_VALUES,
      answered: true,
    });

    expect(next).toEqual({
      kind: "seeded",
      values: SEEDED_VALUES,
      frozen: STEPS,
      everSubmitted: true,
    });
  });

  it("아직 답하지 않은 사람이면 얼린 칸 없이 제출한 적 없다고 적는다", () => {
    const next = pendingFormReducer(UNSEEDED_PENDING_FORM, {
      type: "seed",
      values: EMPTY_VALUES,
      answered: false,
    });

    expect(next).toEqual(SEEDED_EMPTY);
  });

  it("이미 뿌린 뒤에 다시 뿌려도 상태가 바뀌지 않는다", () => {
    const state = {
      kind: "seeded",
      values: { ...EMPTY_VALUES, name: "가짜이름" },
      frozen: ["name"],
      everSubmitted: false,
    };

    const next = pendingFormReducer(state, {
      type: "seed",
      values: SEEDED_VALUES,
      answered: true,
    });

    expect(next).toEqual(state);
  });
});

describe("pendingFormReducer — 씨를 뿌린 뒤의 전이", () => {
  it("값을 쓰면 적은 칸만 바뀌고 얼린 칸은 그대로다", () => {
    const state = { ...SEEDED_EMPTY, frozen: ["photo"] };

    const next = pendingFormReducer(state, {
      type: "write",
      values: { name: "가짜이름" },
    });

    expect(next).toEqual({
      ...state,
      values: { ...EMPTY_VALUES, name: "가짜이름" },
    });
  });

  it("칸을 얼리면 끝에 붙는다", () => {
    const state = { ...SEEDED_EMPTY, frozen: ["photo"] };

    const next = pendingFormReducer(state, { type: "freeze", step: "name" });

    expect(next).toEqual({ ...state, frozen: ["photo", "name"] });
  });

  it("이미 언 칸을 또 얼려도 한 번만 든다", () => {
    const state = { ...SEEDED_EMPTY, frozen: ["photo", "name"] };

    const next = pendingFormReducer(state, { type: "freeze", step: "photo" });

    expect(next).toEqual(state);
  });

  it("칸을 녹이면 얼린 목록에서만 빠진다", () => {
    const state = { ...SEEDED_EMPTY, frozen: ["photo", "name", "gender"] };

    const next = pendingFormReducer(state, { type: "thaw", step: "name" });

    expect(next).toEqual({ ...state, frozen: ["photo", "gender"] });
  });

  it("제출이 끝났다고 적으면 everSubmitted만 켜진다", () => {
    const state = { ...SEEDED_EMPTY, frozen: ["photo"] };

    const next = pendingFormReducer(state, { type: "submitted" });

    expect(next).toEqual({ ...state, everSubmitted: true });
  });
});

describe("pendingFormReducer — 씨를 뿌리기 전에는 쓰기·얼리기·제출 기록이 상태를 바꾸지 않는다", () => {
  it.each([
    ["write", { type: "write", values: { name: "가짜이름" } }],
    ["freeze", { type: "freeze", step: "name" }],
    ["thaw", { type: "thaw", step: "name" }],
    ["submitted", { type: "submitted" }],
  ])("%s는 unseeded를 그대로 돌려준다", (_name, action) => {
    const next = pendingFormReducer(UNSEEDED_PENDING_FORM, action);

    expect(next).toEqual({ kind: "unseeded" });
  });
});
