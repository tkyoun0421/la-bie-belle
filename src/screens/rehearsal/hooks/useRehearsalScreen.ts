import { useRouter } from "expo-router";
import { useCallback, useMemo, useReducer, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { ME_HOME_PATH } from "@/shared/consts/navigation.const";
import { useCloseSheetOnSuccess } from "@/shared/hooks/useCloseSheetOnSuccess";
import { rehearsalDayCell } from "@/shared/model/rehearsalDayCell.policy";
import { monthOf, spellDate, spellMonth } from "@/shared/utils/kstDate";
import { useServerToday } from "@/entities/clock/hooks/useServerToday";
import { kindForDate } from "@/entities/rehearsal/model/kindForDate.policy";
import type {
  Rehearsal,
  RehearsalKind,
} from "@/entities/rehearsal/model/rehearsal.type";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/services/useAllRehearsalsQuery";
import { useMyRehearsalsQuery } from "@/entities/rehearsal/services/useMyRehearsalsQuery";
import { groupRehearsalsByDate } from "@/entities/rehearsal/utils/rehearsalGrouping.utils";
import {
  dayTotal,
  monthTotal,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import { spellTotal } from "@/entities/rehearsal/utils/spellTotal.utils";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
import type { RehearsalFormTarget } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";
import { useRemoveRehearsalMutation } from "@/features/rehearsalEdit/services/useRemoveRehearsalMutation";
import { REHEARSAL_COPY } from "@/screens/rehearsal/consts/rehearsal.const";
import { formTargetOf } from "@/screens/rehearsal/model/rehearsalForm.policy";
import {
  initialRehearsalScreenState,
  rehearsalScreenReducer,
} from "@/screens/rehearsal/model/rehearsalScreen.reducer";

type Row = Rehearsal;

export type RehearsalScreenController = {
  goBack: () => void;
  month: string;
  monthYear: number;
  monthLabel: string;
  totalLabel: string;
  isAdmin: boolean;
  failedLine: string | null;
  openDate: string | null;
  openDateLabel: string;
  openKind: RehearsalKind;
  form: RehearsalFormTarget | null;
  removing: boolean;
  closeTop: (() => boolean) | null;
  cellStateOf: (date: string) => "admin-open" | "plain";
  noteOf: (date: string) => string | null;
  isToday: (date: string) => boolean;
  canPressDay: (date: string) => boolean;
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
  askRemove: (() => void) | undefined;
  cancelRemove: () => void;
  confirmRemove: () => void;
  retry: () => void;
};

export function useRehearsalScreen(
  monthParam?: string,
): RehearsalScreenController {
  const router = useRouter();
  const today = useServerToday();

  const [screen, dispatch] = useReducer(
    rehearsalScreenReducer,
    monthOf(monthParam ?? today),
    initialRehearsalScreenState,
  );
  const [followedParam, setFollowedParam] = useState(monthParam);
  const [removing, setRemoving] = useState(false);

  if (followedParam !== monthParam) {
    setFollowedParam(monthParam);

    if (monthParam !== undefined) {
      dispatch({ type: "follow_month", month: monthOf(monthParam) });
    }
  }

  const { month, pickerYear } = screen;
  const openDate = screen.kind === "browsing" ? null : screen.openDate;
  const openForm = screen.kind === "form" ? screen.form : null;

  const { profile, role, isAdmin } = useMyStanding(supabase);

  const roleKnown = role !== undefined;
  const myProfileId = profile?.id ?? null;

  const mine = useMyRehearsalsQuery(supabase, month, roleKnown && !isAdmin);
  const all = useAllRehearsalsQuery(supabase, month, roleKnown && isAdmin);
  const { data: days } = useMonthScheduleQuery(supabase, month);

  const {
    mutate: remove,
    isSuccess: deleted,
    reset: resetRemove,
  } = useRemoveRehearsalMutation(supabase);

  const closeForm = useCallback(() => {
    dispatch({ type: "close_form" });
    setRemoving(false);
  }, []);

  useCloseSheetOnSuccess(deleted, resetRemove, closeForm);

  const rows: Row[] = useMemo(
    () => (isAdmin ? (all.data ?? []) : (mine.data ?? [])),
    [isAdmin, all.data, mine.data],
  );

  const rowsOf = useMemo(() => groupRehearsalsByDate(rows), [rows]);

  const myAssignments = useMemo(
    () =>
      (days ?? []).flatMap((day) =>
        day.assignments
          .filter((assignment) => assignment.profileId === myProfileId)
          .map((assignment) => ({
            workDate: day.workDate,
            kind: assignment.kind,
            endedAt: assignment.endedAt,
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
    openForm?.mode === "edit"
      ? (openRows.find((row) => row.id === openForm.id) ?? null)
      : null;

  const form = formTargetOf({ openForm, openDate, openKind, editing });

  const openEdit = useCallback(
    (id: string) => {
      if (openRows.some((candidate) => candidate.id === id)) {
        dispatch({ type: "open_form", form: { mode: "edit", id } });
      }
    },
    [openRows],
  );

  const pickMonth = useCallback((picked: string) => {
    dispatch({ type: "pick_month", month: picked });
  }, []);

  const closeTop = useMemo(() => {
    if (openForm !== null) {
      return () => {
        closeForm();

        return true;
      };
    }

    if (openDate !== null) {
      return () => {
        dispatch({ type: "close_day" });

        return true;
      };
    }

    return null;
  }, [openForm, openDate, closeForm]);

  const goBack = useCallback(() => router.replace(ME_HOME_PATH), [router]);

  const failed = (isAdmin ? all.error : mine.error) !== null;

  return {
    goBack,
    month,
    monthYear: Number(month.slice(0, 4)),
    monthLabel: spellMonth(month),
    totalLabel: spellTotal(monthTotal(rows)),
    isAdmin,
    failedLine: failed ? REHEARSAL_COPY.readFailed : null,
    openDate,
    openDateLabel: openDate === null ? "" : spellDate(openDate),
    openKind,
    form,
    removing,
    closeTop,
    cellStateOf: (date) =>
      cellOf(date).state === "has" ? "admin-open" : "plain",
    noteOf: (date) => {
      const cell = cellOf(date);

      return cell.state === "has" ? cell.label : null;
    },
    isToday: (date) => date === today,
    canPressDay: () => true,
    openDay: (date) => dispatch({ type: "open_day", date }),
    closeDay: () => dispatch({ type: "close_day" }),
    pickMonth,
    pickerYear,
    openPicker: () =>
      dispatch({ type: "open_picker", year: Number(month.slice(0, 4)) }),
    changePickerYear: (year) => dispatch({ type: "change_picker_year", year }),
    closePicker: () => dispatch({ type: "close_picker" }),
    openAdd: () => dispatch({ type: "open_form", form: { mode: "add" } }),
    openEdit: isAdmin ? undefined : openEdit,
    closeForm,
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
