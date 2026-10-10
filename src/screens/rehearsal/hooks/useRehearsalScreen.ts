import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { ME_HOME_PATH } from "@/shared/consts/navigation.const";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { monthOf, spellDate, spellMonth } from "@/shared/utils/kstDate";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { kindForDate } from "@/entities/rehearsal/model/kindForDate.policy";
import type {
  Rehearsal,
  RehearsalKind,
} from "@/entities/rehearsal/model/rehearsal.type";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/services/useAllRehearsalsQuery";
import { useMyRehearsalsQuery } from "@/entities/rehearsal/services/useMyRehearsalsQuery";
import {
  dayTotal,
  monthTotal,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";
import { spellTotal } from "@/entities/rehearsal/utils/spellTotal.utils";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import type { RehearsalFormTarget } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";
import { useRemoveRehearsalMutation } from "@/features/rehearsalEdit/services/useRemoveRehearsalMutation";
import { REHEARSAL_COPY } from "@/screens/rehearsal/consts/rehearsal.const";
import { rehearsalDayCell } from "@/screens/rehearsal/model/rehearsalDayCell.policy";

type Row = Rehearsal;

type OpenForm = { mode: "add" } | { mode: "edit"; id: string };

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
  const today = kstToday();

  const [month, setMonth] = useState(monthOf(monthParam ?? today));
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [pickerYear, setPickerYear] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState<OpenForm | null>(null);
  const [removing, setRemoving] = useState(false);

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
    setOpenForm(null);
    setRemoving(false);
  }, []);

  useEffect(() => {
    if (!deleted) {
      return;
    }

    closeForm();
    resetRemove();
  }, [deleted, closeForm, resetRemove]);

  const rows: Row[] = useMemo(
    () => (isAdmin ? (all.data ?? []) : (mine.data ?? [])),
    [isAdmin, all.data, mine.data],
  );

  const rowsOf = useMemo(() => {
    const byDate = new Map<string, Row[]>();

    for (const row of rows) {
      byDate.set(row.workDate, [...(byDate.get(row.workDate) ?? []), row]);
    }

    return byDate;
  }, [rows]);

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

  const form: RehearsalFormTarget | null =
    openForm === null || openDate === null
      ? null
      : openForm.mode === "add"
        ? { mode: "add", workDate: openDate, formKind: openKind }
        : editing === null
          ? null
          : { mode: "edit", rehearsal: editing };

  const openEdit = useCallback(
    (id: string) => {
      if (openRows.some((candidate) => candidate.id === id)) {
        setOpenForm({ mode: "edit", id });
      }
    },
    [openRows],
  );

  const pickMonth = useCallback((picked: string) => {
    setMonth(picked);
    setOpenDate(null);
    setOpenForm(null);
    setPickerYear(null);
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
        setOpenDate(null);

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
    openDay: setOpenDate,
    closeDay: () => setOpenDate(null),
    pickMonth,
    pickerYear,
    openPicker: () => setPickerYear(Number(month.slice(0, 4))),
    changePickerYear: setPickerYear,
    closePicker: () => setPickerYear(null),
    openAdd: () => setOpenForm({ mode: "add" }),
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
