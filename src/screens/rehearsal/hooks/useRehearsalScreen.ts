import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { monthOf, spellDate, spellMonth } from "@/shared/utils/kstDate";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import type { Rehearsal } from "@/entities/rehearsal/api/rehearsal.dto";
import { canAddOn } from "@/entities/rehearsal/model/canAddOn.policy";
import { kindForDate } from "@/entities/rehearsal/model/kindForDate.policy";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/services/useAllRehearsalsQuery";
import { useMyRehearsalsQuery } from "@/entities/rehearsal/services/useMyRehearsalsQuery";
import {
  dayTotal,
  monthTotal,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useAddRehearsalMutation } from "@/features/rehearsalEdit/services/useAddRehearsalMutation";
import { useEditRehearsalMutation } from "@/features/rehearsalEdit/services/useEditRehearsalMutation";
import { useRemoveRehearsalMutation } from "@/features/rehearsalEdit/services/useRemoveRehearsalMutation";
import {
  CLOCK_LENGTH,
  INITIAL_ADD_SHEET,
} from "@/screens/rehearsal/consts/rehearsal.const";
import {
  addSheetActionFor,
  addSheetReducer,
  canSubmitForm,
  type AddSheetState,
  type AddSheetValues,
} from "@/screens/rehearsal/model/addSheetState.reducer";
import { rehearsalDayCell } from "@/screens/rehearsal/model/rehearsalDayCell.policy";
import {
  daySheetRows,
  type DaySheetContent,
} from "@/screens/rehearsal/utils/daySheetRows.utils";
import { spellTotal } from "@/screens/rehearsal/utils/spellTotal.utils";

type Row = Rehearsal & { profiles?: { display_name: string | null } | null };

export type RehearsalFormHandle =
  { mode: "add" } | { mode: "edit"; id: string };

export type RehearsalScreenController = {
  month: string;
  monthYear: number;
  monthLabel: string;
  totalLabel: string;
  isAdmin: boolean;
  failed: boolean;
  openDate: string | null;
  openDateLabel: string;
  dayContent: DaySheetContent;
  canAdd: boolean;
  form: RehearsalFormHandle | null;
  sheet: AddSheetState;
  saving: boolean;
  removing: boolean;
  closeTop: (() => boolean) | null;
  cellStateOf: (date: string) => "admin-open" | "plain";
  noteOf: (date: string) => string | null;
  isToday: (date: string) => boolean;
  openDay: (date: string) => void;
  closeDay: () => void;
  pickMonth: (month: string) => void;
  pickerYear: number | null;
  openPicker: () => void;
  changePickerYear: (year: number) => void;
  closePicker: () => void;
  openAdd: () => void;
  openEdit: ((id: string) => void) | undefined;
  closeForm: () => void;
  change: (values: Partial<AddSheetValues>) => void;
  submit: () => void;
  askRemove: (() => void) | undefined;
  cancelRemove: () => void;
  confirmRemove: () => void;
  retry: () => void;
};

export function useRehearsalScreen(
  monthParam?: string,
): RehearsalScreenController {
  const today = kstToday();

  const [month, setMonth] = useState(monthOf(monthParam ?? today));
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [pickerYear, setPickerYear] = useState<number | null>(null);
  const [form, setForm] = useState<RehearsalFormHandle | null>(null);
  const [removing, setRemoving] = useState(false);
  const [sheet, dispatch] = useReducer(addSheetReducer, INITIAL_ADD_SHEET);

  const { data: me } = useSessionUserQuery(supabase);
  const { data: profile } = useMyProfileRowQuery(supabase, me?.id ?? null);

  const role = profile?.role;
  const isAdmin = role === "admin";
  const roleKnown = role !== undefined;
  const myProfileId = profile?.id ?? null;

  const mine = useMyRehearsalsQuery(supabase, month, roleKnown && !isAdmin);
  const all = useAllRehearsalsQuery(supabase, month, roleKnown && isAdmin);
  const { data: days } = useMonthScheduleQuery(supabase, month);

  const {
    mutate: add,
    isPending: adding,
    isSuccess: added,
    isError: addFailed,
    error: addError,
    reset: resetAdd,
  } = useAddRehearsalMutation(supabase);

  const {
    mutate: save,
    isPending: savingEdit,
    isSuccess: saved,
    isError: editFailed,
    error: editError,
    reset: resetEdit,
  } = useEditRehearsalMutation(supabase);

  const {
    mutate: remove,
    isSuccess: deleted,
    reset: resetRemove,
  } = useRemoveRehearsalMutation(supabase);

  useEffect(() => {
    if (monthParam !== undefined) {
      setMonth(monthOf(monthParam));
    }
  }, [monthParam]);

  const closeForm = useCallback(() => {
    setForm(null);
    setRemoving(false);
    resetAdd();
    resetEdit();
  }, [resetAdd, resetEdit]);

  useEffect(() => {
    if (added || saved) {
      closeForm();
    }
  }, [added, saved, closeForm]);

  useEffect(() => {
    if (!deleted) {
      return;
    }

    closeForm();
    resetRemove();
  }, [deleted, closeForm, resetRemove]);

  useEffect(() => {
    if (!addFailed) {
      return;
    }

    dispatch(addSheetActionFor(addError, sheet.formKind));
    resetAdd();
  }, [addFailed, addError, sheet.formKind, resetAdd]);

  useEffect(() => {
    if (!editFailed) {
      return;
    }

    dispatch(addSheetActionFor(editError, sheet.formKind));
    resetEdit();
  }, [editFailed, editError, sheet.formKind, resetEdit]);

  const rows: Row[] = useMemo(
    () => (isAdmin ? (all.data ?? []) : (mine.data ?? [])),
    [isAdmin, all.data, mine.data],
  );

  const rowsOf = useMemo(() => {
    const byDate = new Map<string, Row[]>();

    for (const row of rows) {
      byDate.set(row.work_date, [...(byDate.get(row.work_date) ?? []), row]);
    }

    return byDate;
  }, [rows]);

  const myAssignments = useMemo(
    () =>
      (days ?? []).flatMap((day) =>
        day.assignments
          .filter((assignment) => assignment.profile_id === myProfileId)
          .map((assignment) => ({
            work_date: day.work_date,
            kind: assignment.kind,
            ended_at: assignment.ended_at,
          })),
      ),
    [days, myProfileId],
  );

  const cellOf = useCallback(
    (date: string) =>
      rehearsalDayCell(dayTotal(rowsOf.get(date) ?? []).minutes),
    [rowsOf],
  );

  const openRows = openDate === null ? [] : (rowsOf.get(openDate) ?? []);
  const openKind =
    openDate === null ? "time" : kindForDate(openDate, myAssignments);
  const editing =
    form?.mode === "edit"
      ? (openRows.find((row) => row.id === form.id) ?? null)
      : null;

  const openAdd = useCallback(() => {
    setForm({ mode: "add" });
    dispatch({ type: "open", kind: openKind });
  }, [openKind]);

  const openEdit = useCallback(
    (id: string) => {
      const row = openRows.find((candidate) => candidate.id === id);

      if (row === undefined) {
        return;
      }

      setForm({ mode: "edit", id });
      dispatch({
        type: "open",
        kind: row.count === null ? "time" : "count",
        values: {
          startsAt: row.starts_at?.slice(0, CLOCK_LENGTH) ?? "",
          endsAt: row.ends_at?.slice(0, CLOCK_LENGTH) ?? "",
          count: row.count === null ? "" : String(row.count),
        },
      });
    },
    [openRows],
  );

  const submit = useCallback(() => {
    if (!canSubmitForm(sheet)) {
      return;
    }

    const written =
      sheet.formKind === "count"
        ? { count: Number(sheet.values.count) }
        : { startsAt: sheet.values.startsAt, endsAt: sheet.values.endsAt };

    if (form?.mode === "edit") {
      save({ id: form.id, ...written });
      return;
    }

    if (openDate !== null) {
      add({ workDate: openDate, ...written });
    }
  }, [sheet, form, openDate, add, save]);

  const pickMonth = useCallback((picked: string) => {
    setMonth(picked);
    setOpenDate(null);
    setForm(null);
  }, []);

  const closeTop = useMemo(() => {
    if (form !== null) {
      return () => {
        closeForm();

        return true;
      };
    }

    if (openDate !== null) {
      return () => {
        setOpenDate(null);

        return true;
      };
    }

    return null;
  }, [form, openDate, closeForm]);

  return {
    month,
    monthYear: Number(month.slice(0, 4)),
    monthLabel: spellMonth(month),
    totalLabel: spellTotal(monthTotal(rows)),
    isAdmin,
    failed: (isAdmin ? all.error : mine.error) !== null,
    openDate,
    openDateLabel: openDate === null ? "" : spellDate(openDate),
    dayContent: daySheetRows(openRows, isAdmin),
    canAdd: !isAdmin && canAddOn(openKind, openRows),
    form,
    sheet,
    saving: adding || savingEdit,
    removing,
    closeTop,
    cellStateOf: (date) =>
      cellOf(date).state === "has" ? "admin-open" : "plain",
    noteOf: (date) => {
      const cell = cellOf(date);

      return cell.state === "has" ? cell.label : null;
    },
    isToday: (date) => date === today,
    openDay: setOpenDate,
    closeDay: () => setOpenDate(null),
    pickMonth,
    pickerYear,
    openPicker: () => setPickerYear(Number(month.slice(0, 4))),
    changePickerYear: setPickerYear,
    closePicker: () => setPickerYear(null),
    openAdd,
    openEdit: isAdmin ? undefined : openEdit,
    closeForm,
    change: (values) => dispatch({ type: "change", values }),
    submit,
    askRemove: editing === null ? undefined : () => setRemoving(true),
    cancelRemove: () => setRemoving(false),
    confirmRemove: () => {
      if (editing !== null) {
        remove(editing.id);
      }
    },
    retry: () => (isAdmin ? all.refetch() : mine.refetch()),
  };
}
