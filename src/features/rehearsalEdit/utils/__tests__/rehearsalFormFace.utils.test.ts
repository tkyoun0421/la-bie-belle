import {
  EMPTY_ADD_SHEET_VALUES,
  FORM_COPY,
} from "@/features/rehearsalEdit/consts/rehearsalEdit.const";
import type { AddSheetState } from "@/features/rehearsalEdit/model/addSheetState.reducer";
import type { RehearsalFormFaceInput } from "@/features/rehearsalEdit/model/rehearsalFormSheet.type";
import { rehearsalFormFace } from "@/features/rehearsalEdit/utils/rehearsalFormFace.utils";

function stateFor(overrides: Partial<AddSheetState> = {}): AddSheetState {
  return {
    formKind: "time",
    values: { ...EMPTY_ADD_SHEET_VALUES },
    notice: null,
    ...overrides,
  };
}

function formFor(overrides: Partial<RehearsalFormFaceInput> = {}) {
  return rehearsalFormFace({
    mode: "add",
    dateLabel: "10월 3일 금요일",
    state: stateFor(),
    ...overrides,
  });
}

describe("rehearsalFormFace — 시트가 그릴 값을 완성해 준다", () => {
  it("넣는 면의 제목을 날짜와 묶어 준다", () => {
    const face = formFor();

    expect(face.title).toBe(`${FORM_COPY.addTitle} · 10월 3일 금요일`);
  });

  it("고치는 면은 다른 제목과 다른 단추 문구를 든다", () => {
    const face = formFor({ mode: "edit" });

    expect(face.title).toBe(`${FORM_COPY.editTitle} · 10월 3일 금요일`);
    expect(face.submitLabel).toBe(FORM_COPY.editSubmit);
  });

  it("넣는 면의 단추는 넣기다", () => {
    expect(formFor().submitLabel).toBe(FORM_COPY.addSubmit);
  });

  it("시각으로 넣는 날은 시각 안내를 준다", () => {
    expect(formFor().guide).toBe(FORM_COPY.timeGuide);
  });

  it("건수로 넣는 날은 건수 안내를 준다", () => {
    const face = formFor({ state: stateFor({ formKind: "count" }) });

    expect(face.guide).toBe(FORM_COPY.countGuide);
  });

  it("알림이 없으면 세 자리가 다 비어 있다", () => {
    const face = formFor();

    expect(face.wrongKindNotice).toBeNull();
    expect(face.overlapsNotice).toBeNull();
    expect(face.transportNotice).toBeNull();
  });

  it("근무가 바뀐 알림은 알림 자리에만 담긴다", () => {
    const face = formFor({
      state: stateFor({
        notice: { kind: "wrong_kind", message: "이 날의 근무가 바뀌었어요" },
      }),
    });

    expect(face.wrongKindNotice).toBe("이 날의 근무가 바뀌었어요");
    expect(face.overlapsNotice).toBeNull();
    expect(face.transportNotice).toBeNull();
  });

  it("겹침 알림은 겹침 자리에만 담긴다", () => {
    const face = formFor({
      state: stateFor({
        notice: { kind: "overlaps", message: "이미 있어요" },
      }),
    });

    expect(face.overlapsNotice).toBe("이미 있어요");
    expect(face.wrongKindNotice).toBeNull();
  });

  it("보내지 못한 알림은 까닭까지 한 줄로 묶는다", () => {
    const face = formFor({
      state: stateFor({
        notice: {
          kind: "transport_error",
          message: "넣지 못했어요",
          detail: "다시 넣어볼게요",
        },
      }),
    });

    expect(face.transportNotice).toBe("넣지 못했어요\n다시 넣어볼게요");
  });

  it("시각이 다 차지 않으면 보낼 수 없다", () => {
    const face = formFor({
      state: stateFor({
        values: { startsAt: "19:00", endsAt: "", count: "" },
      }),
    });

    expect(face.canSubmit).toBe(false);
  });

  it("시각이 둘 다 차면 보낼 수 있다", () => {
    const face = formFor({
      state: stateFor({
        values: { startsAt: "19:00", endsAt: "21:00", count: "" },
      }),
    });

    expect(face.canSubmit).toBe(true);
  });

  it("건수가 비어 있으면 보낼 수 없다", () => {
    const face = formFor({
      state: stateFor({ formKind: "count" }),
    });

    expect(face.canSubmit).toBe(false);
  });

  it("건수가 범위 안이면 보낼 수 있다", () => {
    const face = formFor({
      state: stateFor({
        formKind: "count",
        values: { startsAt: "", endsAt: "", count: "3" },
      }),
    });

    expect(face.canSubmit).toBe(true);
  });

  it("넣은 값과 어느 꼴인지를 그대로 넘겨준다", () => {
    const values = { startsAt: "19:00", endsAt: "21:00", count: "" };
    const face = formFor({
      state: stateFor({ values }),
    });

    expect(face.formKind).toBe("time");
    expect(face.values).toEqual(values);
  });
});
