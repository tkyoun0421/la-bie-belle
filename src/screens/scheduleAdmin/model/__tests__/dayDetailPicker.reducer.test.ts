const { CLOSED_DAY_DETAIL_PICKER, dayDetailPickerReducer } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/scheduleAdmin/model/dayDetailPicker.reducer"
);

const TARGET = { position: "홀", slotId: "slot-1", replacing: null };

const OTHER_TARGET = {
  position: "주방",
  slotId: "slot-2",
  replacing: {
    assignmentId: "assignment-1",
    outgoingProfileId: "profile-9",
    outgoingName: "가짜이름",
  },
};

const ENTRY = {
  profileId: "profile-1",
  displayName: "가짜하나",
  category: "assignable",
  message: null,
  checkbox: true,
  photoUrl: null,
  gender: null,
};

const OTHER_ENTRY = { ...ENTRY, profileId: "profile-2", displayName: "가짜둘" };

const PICKING = {
  kind: "picking",
  target: TARGET,
  expanded: false,
  picked: [],
  inspecting: null,
  qualifying: null,
};

describe("dayDetailPickerReducer — 초기 상태", () => {
  it("고르는 창이 닫혀 있고 다른 데이터는 없다", () => {
    expect(CLOSED_DAY_DETAIL_PICKER).toEqual({ kind: "closed" });
  });
});

describe("dayDetailPickerReducer — 창을 연다", () => {
  it("닫힌 상태에서 열면 대상만 들고 접힌 채 비어 선다", () => {
    const next = dayDetailPickerReducer(CLOSED_DAY_DETAIL_PICKER, {
      type: "open",
      target: TARGET,
    });

    expect(next).toEqual({
      kind: "picking",
      target: TARGET,
      expanded: false,
      picked: [],
      inspecting: null,
      qualifying: null,
    });
  });

  it("이미 열려 있을 때 열면 대상이 바뀌고 펼침이 접히며 고른 것은 그대로다", () => {
    const state = {
      ...PICKING,
      expanded: true,
      picked: ["profile-1"],
      inspecting: ENTRY,
      qualifying: OTHER_ENTRY,
    };

    const next = dayDetailPickerReducer(state, {
      type: "open",
      target: OTHER_TARGET,
    });

    expect(next).toEqual({ ...state, target: OTHER_TARGET, expanded: false });
  });
});

describe("dayDetailPickerReducer — 열린 창 안에서의 전이", () => {
  it("펼치면 expanded가 켜진다", () => {
    const next = dayDetailPickerReducer(PICKING, { type: "expand" });

    expect(next).toEqual({ ...PICKING, expanded: true });
  });

  it("요청 대상을 토글하면 고른 목록에 들어간다", () => {
    const next = dayDetailPickerReducer(PICKING, {
      type: "toggle",
      profileId: "profile-1",
    });

    expect(next).toEqual({ ...PICKING, picked: ["profile-1"] });
  });

  it("이미 고른 사람을 토글하면 목록에서 빠진다", () => {
    const state = { ...PICKING, picked: ["profile-1", "profile-2"] };

    const next = dayDetailPickerReducer(state, {
      type: "toggle",
      profileId: "profile-1",
    });

    expect(next).toEqual({ ...state, picked: ["profile-2"] });
  });

  it("사람을 살펴보면 inspecting에 그 사람이 선다", () => {
    const next = dayDetailPickerReducer(PICKING, {
      type: "inspect",
      entry: ENTRY,
    });

    expect(next).toEqual({ ...PICKING, inspecting: ENTRY });
  });

  it("살펴보기를 닫으면 inspecting만 비고 나머지는 그대로다", () => {
    const state = { ...PICKING, picked: ["profile-1"], inspecting: ENTRY };

    const next = dayDetailPickerReducer(state, { type: "stop_inspecting" });

    expect(next).toEqual({ ...state, inspecting: null });
  });

  it("자격이 없는 사람을 누르면 qualifying에 그 사람이 선다", () => {
    const next = dayDetailPickerReducer(PICKING, {
      type: "qualify",
      entry: ENTRY,
    });

    expect(next).toEqual({ ...PICKING, qualifying: ENTRY });
  });

  it("자격 물음을 닫으면 qualifying만 비고 나머지는 그대로다", () => {
    const state = { ...PICKING, picked: ["profile-1"], qualifying: ENTRY };

    const next = dayDetailPickerReducer(state, { type: "stop_qualifying" });

    expect(next).toEqual({ ...state, qualifying: null });
  });
});

describe("dayDetailPickerReducer — 창을 닫으면 열린 가지의 데이터가 하나도 안 남는다", () => {
  it("대상·펼침·고른 것·살펴보기·자격 물음이 전부 찬 상태에서 닫아도 closed 하나만 남는다", () => {
    const state = {
      kind: "picking",
      target: OTHER_TARGET,
      expanded: true,
      picked: ["profile-1", "profile-2"],
      inspecting: ENTRY,
      qualifying: OTHER_ENTRY,
    };

    const next = dayDetailPickerReducer(state, { type: "close" });

    expect(next).toEqual({ kind: "closed" });
  });

  it("이미 닫힌 상태에서 닫아도 closed다", () => {
    const next = dayDetailPickerReducer(CLOSED_DAY_DETAIL_PICKER, {
      type: "close",
    });

    expect(next).toEqual({ kind: "closed" });
  });
});

describe("dayDetailPickerReducer — 닫힌 상태에서는 창 안의 action이 상태를 바꾸지 않는다", () => {
  it.each([
    ["expand", { type: "expand" }],
    ["toggle", { type: "toggle", profileId: "profile-1" }],
    ["inspect", { type: "inspect", entry: ENTRY }],
    ["stop_inspecting", { type: "stop_inspecting" }],
    ["qualify", { type: "qualify", entry: ENTRY }],
    ["stop_qualifying", { type: "stop_qualifying" }],
  ])("%s는 closed를 그대로 돌려준다", (_name, action) => {
    const next = dayDetailPickerReducer(CLOSED_DAY_DETAIL_PICKER, action);

    expect(next).toEqual({ kind: "closed" });
  });
});
