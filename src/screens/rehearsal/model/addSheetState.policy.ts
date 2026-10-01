import { DomainError } from "@/shared/model/error.type";
import type { RehearsalKind } from "@/entities/rehearsal/model/kindForDate.policy";

/**
 * 넣는 시트와 고치는 시트가 같이 쓰는 상태다
 * (`docs/2-design/modules/schedule/screens/rehearsal.md`의 「넣는 중」과 「문안」).
 *
 * **거절이 시트를 안 닫는다.** 셋 다 넣던 값을 그대로 두고 말만 바꾼다 — 다시 넣을 자리가
 * 시트 안이라서다.
 *
 * - `wrong_kind` — 시트를 연 사이에 관리자가 그날 배정을 넣거나 뺐다. 갈래를 바꾸고 알림
 *   한 줄을 세우되 **고른 날짜는 그대로다**. 오류가 아니라 앱이 규칙대로 움직인 것이라
 *   중립으로 말한다
 * - `overlaps` — 칸 아래 문구 한 줄이다. 값이 남아 그 자리에서 시각만 고친다
 * - `transport_error` — 저장이 실패했다. 제목과 아래 줄 둘로 말한다
 */

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

/**
 * 저장이 거절당했을 때 시트가 받을 행동이다. `wrong_kind`는 그날 갈래가 뒤집혔다는 말이라
 * 반대 갈래로 넘긴다 — 두 갈래뿐이라 서버에 다시 묻지 않는다. 나머지는 통신 실패와 같은
 * 자리에서 말한다.
 */
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

const MIN_COUNT = 1;

const MAX_COUNT = 9;

const CLOCK_LENGTH = "14:00".length;

/**
 * 칸이 덜 차면 넣기가 안 눌린다. 건수 칸은 한 자리고 0을 넣으면 안 눌린다 — 시각과 건수의
 * 하한은 표의 check와 같은 값이라(`count between 1 and 9`) 화면이 먼저 막고 서버가 다시
 * 막는다.
 */
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
