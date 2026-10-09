import { renderHook } from "@testing-library/react-native";
import {
  EMPTY_ADD_SHEET_VALUES,
  FORM_COPY,
} from "@/screens/rehearsal/consts/rehearsal.const";
import { useRehearsalFormSheet } from "@/screens/rehearsal/hooks/useRehearsalFormSheet";
import type { AddSheetState } from "@/screens/rehearsal/model/addSheetState.reducer";
import type { RehearsalFormSheetInput } from "@/screens/rehearsal/model/rehearsalFormSheet.type";

function stateFor(overrides: Partial<AddSheetState> = {}): AddSheetState {
  return {
    formKind: "time",
    values: { ...EMPTY_ADD_SHEET_VALUES },
    notice: null,
    ...overrides,
  };
}

function formFor(overrides: Partial<RehearsalFormSheetInput> = {}) {
  return renderHook(() =>
    useRehearsalFormSheet({
      mode: "add",
      dateLabel: "10월 3일 금요일",
      state: stateFor(),
      ...overrides,
    }),
  );
}

describe("useRehearsalFormSheet — 시트가 그릴 값을 완성해 준다", () => {
  it("넣는 면의 제목을 날짜와 묶어 준다", () => {
    const { result } = formFor();

    expect(result.current.title).toBe(
      `${FORM_COPY.addTitle} · 10월 3일 금요일`,
    );
  });

  it("고치는 면은 다른 제목과 다른 단추 문구를 든다", () => {
    const { result } = formFor({ mode: "edit" });

    expect(result.current.title).toBe(
      `${FORM_COPY.editTitle} · 10월 3일 금요일`,
    );
    expect(result.current.submitLabel).toBe(FORM_COPY.editSubmit);
  });

  it("넣는 면의 단추는 넣기다", () => {
    expect(formFor().result.current.submitLabel).toBe(FORM_COPY.addSubmit);
  });

  it("시각으로 넣는 날은 시각 안내를 준다", () => {
    expect(formFor().result.current.guide).toBe(FORM_COPY.timeGuide);
  });

  it("건수로 넣는 날은 건수 안내를 준다", () => {
    const { result } = formFor({ state: stateFor({ formKind: "count" }) });

    expect(result.current.guide).toBe(FORM_COPY.countGuide);
  });

  it("알림이 없으면 세 자리가 다 비어 있다", () => {
    const { result } = formFor();

    expect(result.current.wrongKindNotice).toBeNull();
    expect(result.current.overlapsNotice).toBeNull();
    expect(result.current.transportNotice).toBeNull();
  });

  it("근무가 바뀐 알림은 알림 자리에만 담긴다", () => {
    const { result } = formFor({
      state: stateFor({
        notice: { kind: "wrong_kind", message: "이 날의 근무가 바뀌었어요" },
      }),
    });

    expect(result.current.wrongKindNotice).toBe("이 날의 근무가 바뀌었어요");
    expect(result.current.overlapsNotice).toBeNull();
    expect(result.current.transportNotice).toBeNull();
  });

  it("겹침 알림은 겹침 자리에만 담긴다", () => {
    const { result } = formFor({
      state: stateFor({
        notice: { kind: "overlaps", message: "이미 있어요" },
      }),
    });

    expect(result.current.overlapsNotice).toBe("이미 있어요");
    expect(result.current.wrongKindNotice).toBeNull();
  });

  it("보내지 못한 알림은 까닭까지 한 줄로 묶는다", () => {
    const { result } = formFor({
      state: stateFor({
        notice: {
          kind: "transport_error",
          message: "넣지 못했어요",
          detail: "다시 넣어볼게요",
        },
      }),
    });

    expect(result.current.transportNotice).toBe(
      "넣지 못했어요\n다시 넣어볼게요",
    );
  });

  it("시각이 다 차지 않으면 보낼 수 없다", () => {
    const { result } = formFor({
      state: stateFor({
        values: { startsAt: "19:00", endsAt: "", count: "" },
      }),
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it("시각이 둘 다 차면 보낼 수 있다", () => {
    const { result } = formFor({
      state: stateFor({
        values: { startsAt: "19:00", endsAt: "21:00", count: "" },
      }),
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it("건수가 비어 있으면 보낼 수 없다", () => {
    const { result } = formFor({
      state: stateFor({ formKind: "count" }),
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it("건수가 범위 안이면 보낼 수 있다", () => {
    const { result } = formFor({
      state: stateFor({
        formKind: "count",
        values: { startsAt: "", endsAt: "", count: "3" },
      }),
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it("넣은 값과 어느 꼴인지를 그대로 넘겨준다", () => {
    const values = { startsAt: "19:00", endsAt: "21:00", count: "" };
    const { result } = formFor({
      state: stateFor({ values }),
    });

    expect(result.current.formKind).toBe("time");
    expect(result.current.values).toEqual(values);
  });
});
