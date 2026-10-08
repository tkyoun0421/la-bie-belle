import { DomainError } from "@/shared/model/error.type";
import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";
import {
  CLOCK_LENGTH,
  MAX_COUNT,
  MIN_COUNT,
} from "@/screens/rehearsal/consts/rehearsal.const";

export type AddSheetValues = {
  startsAt: string;
  endsAt: string;
  count: string;
};

export type AddSheetNotice =
  | { kind: "wrong_kind"; message: string }
  | { kind: "overlaps"; message: string }
  | { kind: "transport_error"; message: string; detail: string };

export type AddSheetState = {
  formKind: RehearsalKind;
  values: AddSheetValues;
  notice: AddSheetNotice | null;
};

export type AddSheetAction =
  | { type: "open"; kind: RehearsalKind; values?: Partial<AddSheetValues> }
  | { type: "change"; values: Partial<AddSheetValues> }
  | { type: "wrong_kind"; kind: RehearsalKind }
  | { type: "overlaps" }
  | { type: "transport_error" };

export const EMPTY_VALUES: AddSheetValues = {
  startsAt: "",
  endsAt: "",
  count: "",
};

export const INITIAL_SHEET: AddSheetState = {
  formKind: "time",
  values: EMPTY_VALUES,
  notice: null,
};

export function addSheetActionFor(
  error: unknown,
  formKind: RehearsalKind,
): AddSheetAction {
  const code = error instanceof DomainError ? error.code : null;

  if (code === "wrong_kind") {
    return { type: "wrong_kind", kind: formKind === "time" ? "count" : "time" };
  }

  return code === "overlaps"
    ? { type: "overlaps" }
    : { type: "transport_error" };
}

export function canSubmitForm({ formKind, values }: AddSheetState): boolean {
  if (formKind === "count") {
    const count = Number(values.count);

    return (
      values.count !== "" &&
      Number.isInteger(count) &&
      count >= MIN_COUNT &&
      count <= MAX_COUNT
    );
  }

  return (
    values.startsAt.length === CLOCK_LENGTH &&
    values.endsAt.length === CLOCK_LENGTH
  );
}

export function addSheetReducer(
  state: AddSheetState,
  action: AddSheetAction,
): AddSheetState {
  switch (action.type) {
    case "open":
      return {
        formKind: action.kind,
        values: { ...EMPTY_VALUES, ...action.values },
        notice: null,
      };
    case "change":
      return {
        ...state,
        values: { ...state.values, ...action.values },
        notice: null,
      };
    case "wrong_kind":
      return {
        ...state,
        formKind: action.kind,
        notice: {
          kind: "wrong_kind",
          message: "이 날의 근무가 바뀌었어요 · 다시 넣어주세요",
        },
      };
    case "overlaps":
      return {
        ...state,
        notice: {
          kind: "overlaps",
          message: "이 시간에 넣은 리허설이 이미 있어요",
        },
      };
    case "transport_error":
      return {
        ...state,
        notice: {
          kind: "transport_error",
          message: "리허설을 넣지 못했어요",
          detail: "넣은 값은 그대로 있어요 · 다시 넣어볼게요",
        },
      };
  }
}
