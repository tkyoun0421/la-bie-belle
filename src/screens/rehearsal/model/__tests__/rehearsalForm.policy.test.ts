const { formTargetOf } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/rehearsal/model/rehearsalForm.policy"
);

const EDITING = {
  id: "a",
  profileId: "me",
  workDate: "2026-10-05",
  startsAt: "14:00:00",
  endsAt: "16:00:00",
  count: null,
  name: null,
};

describe("formTargetOf — 열린 폼이 무엇을 싣고 서는지", () => {
  it("넣기 폼은 그날과 그날의 갈래를 싣는다", () => {
    expect(
      formTargetOf({
        openForm: { mode: "add" },
        openDate: "2026-10-05",
        openKind: "time",
        editing: null,
      }),
    ).toEqual({ mode: "add", workDate: "2026-10-05", formKind: "time" });
  });

  it("횟수로 재는 날의 넣기 폼은 그 갈래를 싣는다", () => {
    expect(
      formTargetOf({
        openForm: { mode: "add" },
        openDate: "2026-10-05",
        openKind: "count",
        editing: null,
      }),
    ).toEqual({ mode: "add", workDate: "2026-10-05", formKind: "count" });
  });

  it("고치기 폼은 고칠 줄을 싣는다", () => {
    expect(
      formTargetOf({
        openForm: { mode: "edit", id: "a" },
        openDate: "2026-10-05",
        openKind: "time",
        editing: EDITING,
      }),
    ).toEqual({ mode: "edit", rehearsal: EDITING });
  });

  it("고칠 줄이 없으면 폼이 안 선다", () => {
    expect(
      formTargetOf({
        openForm: { mode: "edit", id: "gone" },
        openDate: "2026-10-05",
        openKind: "time",
        editing: null,
      }),
    ).toBeNull();
  });

  it("열린 폼이 없으면 폼이 안 선다", () => {
    expect(
      formTargetOf({
        openForm: null,
        openDate: "2026-10-05",
        openKind: "time",
        editing: null,
      }),
    ).toBeNull();
  });

  it("열린 날이 없으면 넣기 폼도 안 선다", () => {
    expect(
      formTargetOf({
        openForm: { mode: "add" },
        openDate: null,
        openKind: "time",
        editing: null,
      }),
    ).toBeNull();
  });
});
