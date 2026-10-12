export type RehearsalOpenForm = { mode: "add" } | { mode: "edit"; id: string };

export type RehearsalScreenState =
  | { kind: "browsing"; month: string; pickerYear: number | null }
  | { kind: "day"; month: string; pickerYear: number | null; openDate: string }
  | {
      kind: "form";
      month: string;
      pickerYear: number | null;
      openDate: string;
      form: RehearsalOpenForm;
    };

export type RehearsalScreenAction =
  | { type: "open_day"; date: string }
  | { type: "close_day" }
  | { type: "open_form"; form: RehearsalOpenForm }
  | { type: "close_form" }
  | { type: "pick_month"; month: string }
  | { type: "follow_month"; month: string }
  | { type: "open_picker"; year: number }
  | { type: "change_picker_year"; year: number }
  | { type: "close_picker" };

export function initialRehearsalScreenState(
  month: string,
): RehearsalScreenState {
  return { kind: "browsing", month, pickerYear: null };
}

export function rehearsalScreenReducer(
  state: RehearsalScreenState,
  action: RehearsalScreenAction,
): RehearsalScreenState {
  switch (action.type) {
    case "open_day":
      return state.kind === "browsing"
        ? { ...state, kind: "day", openDate: action.date }
        : { ...state, openDate: action.date };
    case "close_day":
      return state.kind === "browsing"
        ? state
        : {
            kind: "browsing",
            month: state.month,
            pickerYear: state.pickerYear,
          };
    case "open_form":
      return state.kind === "browsing"
        ? state
        : { ...state, kind: "form", form: action.form };
    case "close_form":
      return state.kind === "form"
        ? {
            kind: "day",
            month: state.month,
            pickerYear: state.pickerYear,
            openDate: state.openDate,
          }
        : state;
    case "pick_month":
      return initialRehearsalScreenState(action.month);
    case "follow_month":
      return { ...state, month: action.month };
    case "open_picker":
    case "change_picker_year":
      return { ...state, pickerYear: action.year };
    case "close_picker":
      return { ...state, pickerYear: null };
  }
}
