import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { BackHandler, Pressable, ScrollView, View } from "react-native";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import {
  kstToday,
  monthOf,
  spellDate,
  spellMonth,
} from "@/shared/lib/kst-date";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { MonthPickerSheet } from "@/shared/ui/MonthPickerSheet";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import type { Rehearsal } from "@/entities/rehearsal/dals/get-my-rehearsals";
import { useMyProfile } from "@/features/profile/model/useMyProfile";
import { canAddOn } from "@/features/rehearsal/model/can-add-on";
import { kindForDate } from "@/features/rehearsal/model/kind-for-date";
import {
  dayTotal,
  monthTotal,
} from "@/features/rehearsal/model/rehearsal-hours";
import { useAddRehearsal } from "@/features/rehearsal/model/useAddRehearsal";
import { useAllRehearsals } from "@/features/rehearsal/model/useAllRehearsals";
import { useEditRehearsal } from "@/features/rehearsal/model/useEditRehearsal";
import { useMyRehearsals } from "@/features/rehearsal/model/useMyRehearsals";
import { useRemoveRehearsal } from "@/features/rehearsal/model/useRemoveRehearsal";
import { useMonthSchedule } from "@/features/schedule/model/useMonthSchedule";
import {
  addSheetActionFor,
  addSheetReducer,
  canSubmitForm,
  EMPTY_VALUES,
  type AddSheetState,
} from "@/screens/rehearsal/model/add-sheet-state";
import { daySheetRows } from "@/screens/rehearsal/model/day-sheet-rows";
import { rehearsalDayCell } from "@/screens/rehearsal/model/rehearsal-day-cell";
import { spellTotal } from "@/screens/rehearsal/model/spell-total";
import { RehearsalDaySheet } from "@/screens/rehearsal/ui/RehearsalDaySheet";
import { RehearsalFormSheet } from "@/screens/rehearsal/ui/RehearsalFormSheet";

/**
 * 자격이 있는 사람이 자기 리허설을 넣고 고치고 지우는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/rehearsal.md`고 완료 조건은
 * `docs/2-design/spec/rehearsal.md`다.
 *
 * **근무표와 떨어져 있다.** 리허설은 날이 열렸는지 근무표가 확정됐는지를 안 보고 아무
 * 날짜에나 서기 때문에(`docs/2-design/modules/schedule/README.md`의 SCH-022) `/schedule`의
 * 날 시트를 문으로 쓸 수 없다 — 확정 전 달에서는 그 시트가 제출 모드라 열리지 않는다. 같은
 * 손짓을 쓰되 달력을 따로 세운다.
 *
 * **모든 날이 눌린다.** 근무표 달력과 가장 다른 자리다. 지난 달도 내년도 같고 흐려지는 칸이
 * 없다.
 *
 * **바닥에 고정 버튼이 없다.** 넣는 문이 날마다 있어서다 — 화면 아래에 「리허설 넣기」를
 * 세우면 어느 날에 넣을지를 다시 물어야 하고, 그것이 달력을 세운 이유를 지운다.
 *
 * **관리자는 같은 화면을 읽기만 한다.** 칸의 수가 전원 것이고 줄에 이름이 붙으며 넣는 길이
 * 없다(SCH-020).
 *
 * **읽는 중에는 바닥 단과 합계만 빈다.** 스켈레톤을 안 깐다 — 달력 뼈대는 날짜만으로 이미
 * 서 있고 넣는 일은 읽기가 끝나기를 안 기다린다.
 *
 * 문을 지키는 것은 이 화면이 아니라 라우트다(`src/app/me/rehearsals.tsx`) — 자격 판정에
 * 「나」 슬라이스의 손이 필요해 조립이 위 층에서 일어난다.
 */

const MONTH_CHEVRON_SIZE = 14;

const LEGEND = "칸 아래 숫자는 그날 리허설 시간이에요";

const READ_FAILED = "리허설을 불러오지 못했어요";

const CLOCK_LENGTH = "14:00".length;

const INITIAL_FORM: AddSheetState = {
  formKind: "time",
  values: EMPTY_VALUES,
  notice: null,
};

type OpenForm = { mode: "add" } | { mode: "edit"; id: string };

/**
 * 본인 것과 전원 것이 한 자리에 선다. 이름은 관리자가 읽을 때만 실려 오므로 선택이다 —
 * 줄 문구를 만드는 `daySheetRows`가 그 자리를 안다.
 */
type Row = Rehearsal & { profiles?: { display_name: string | null } | null };

export type RehearsalScreenProps = {
  month?: string;
};

export function RehearsalScreen({ month: monthParam }: RehearsalScreenProps) {
  const router = useRouter();
  const today = kstToday();

  const [userId, setUserId] = useState<string | null>(null);
  const [month, setMonth] = useState(monthOf(monthParam ?? today));
  const [pickerYear, setPickerYear] = useState<number | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [form, setForm] = useState<OpenForm | null>(null);
  const [removing, setRemoving] = useState(false);
  const [sheet, dispatch] = useReducer(addSheetReducer, INITIAL_FORM);

  const { data: profile } = useMyProfile(supabase, userId);

  const isAdmin = profile?.role === "admin";
  const myProfileId = profile?.id ?? null;

  const mine = useMyRehearsals(supabase, month, !isAdmin);
  const all = useAllRehearsals(supabase, month, isAdmin);
  const { data: days } = useMonthSchedule(supabase, month);

  const {
    mutate: add,
    isPending: adding,
    isSuccess: added,
    isError: addFailed,
    error: addError,
    reset: resetAdd,
  } = useAddRehearsal(supabase);

  const {
    mutate: save,
    isPending: savingEdit,
    isSuccess: saved,
    isError: editFailed,
    error: editError,
    reset: resetEdit,
  } = useEditRehearsal(supabase);

  const {
    mutate: remove,
    isSuccess: deleted,
    reset: resetRemove,
  } = useRemoveRehearsal(supabase);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => setUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (monthParam !== undefined) {
      setMonth(monthOf(monthParam));
    }
  }, [monthParam]);

  const closeForm = useCallback(() => {
    setForm(null);
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

    setRemoving(false);
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

  useEffect(() => {
    if (openDate === null && form === null) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (form !== null) {
          closeForm();
        } else {
          setOpenDate(null);
        }

        return true;
      },
    );

    return () => subscription.remove();
  }, [openDate, form, closeForm]);

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

  const failed = (isAdmin ? all.error : mine.error) !== null;
  const openRows = openDate === null ? [] : (rowsOf.get(openDate) ?? []);
  const openKind =
    openDate === null ? "time" : kindForDate(openDate, myAssignments);
  const editing =
    form?.mode === "edit"
      ? (openRows.find((row) => row.id === form.id) ?? null)
      : null;

  const openAdd = () => {
    setForm({ mode: "add" });
    dispatch({ type: "open", kind: openKind });
  };

  const openEdit = (id: string) => {
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
  };

  const submit = () => {
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
  };

  return (
    <Screen>
      <AppBar title="리허설" onBack={() => router.replace("/me")} />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          <View className="h-12 flex-row items-center justify-between gap-3">
            <Pressable
              accessibilityRole="button"
              testID="rehearsal-month"
              onPress={() => setPickerYear(Number(month.slice(0, 4)))}
              className="flex-row items-center gap-1"
            >
              <Text size="base" weight="medium">
                {spellMonth(month)}
              </Text>
              <Icon
                icon={ChevronDown}
                size={MONTH_CHEVRON_SIZE}
                tone="subtle"
              />
            </Pressable>
            <Text size="xs" tone="subtle" numeric>
              {spellTotal(monthTotal(rows))}
            </Text>
          </View>

          <Card>
            <MonthCalendar
              month={month}
              stateOf={(date) =>
                rehearsalDayCell(dayTotal(rowsOf.get(date) ?? []).minutes)
                  .state === "has"
                  ? "admin-open"
                  : "plain"
              }
              isToday={(date) => date === today}
              canPress={() => true}
              onPressDay={setOpenDate}
              noteOf={(date) => {
                const cell = rehearsalDayCell(
                  dayTotal(rowsOf.get(date) ?? []).minutes,
                );

                return cell.state === "has" ? cell.label : null;
              }}
            />
          </Card>

          <Text size="xs" tone="subtle">
            {LEGEND}
          </Text>

          {failed ? (
            <View className="flex-row items-center gap-2">
              <Text size="xs" tone="subtle">
                {READ_FAILED}
              </Text>
              <Button
                variant="ghost"
                size="compact"
                onPress={() => (isAdmin ? all.refetch() : mine.refetch())}
              >
                다시 시도
              </Button>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {openDate === null ? null : (
        <SheetLayer onDismiss={() => setOpenDate(null)}>
          <RehearsalDaySheet
            title={spellDate(openDate)}
            content={daySheetRows(openRows, isAdmin)}
            canAdd={!isAdmin && canAddOn(openKind, openRows)}
            onPressRow={isAdmin ? undefined : openEdit}
            onAdd={openAdd}
          />
        </SheetLayer>
      )}

      {form === null || openDate === null ? null : (
        <SheetLayer onDismiss={closeForm}>
          <RehearsalFormSheet
            mode={form.mode}
            dateLabel={spellDate(openDate)}
            state={sheet}
            saving={adding || savingEdit}
            onChange={(values) => dispatch({ type: "change", values })}
            onSubmit={submit}
            onClose={closeForm}
            onRemove={editing === null ? undefined : () => setRemoving(true)}
          />
        </SheetLayer>
      )}

      {pickerYear === null ? null : (
        <MonthPickerSheet
          year={pickerYear}
          selectedMonth={month}
          onPick={(picked) => {
            setMonth(picked);
            setPickerYear(null);
            setOpenDate(null);
            setForm(null);
          }}
          onYearChange={setPickerYear}
          onDismiss={() => setPickerYear(null)}
        />
      )}

      <Dialog
        visible={removing && editing !== null}
        title="이 리허설을 지울까요?"
        closeLabel="그만두기"
        confirmLabel="지우기"
        confirmTestID="rehearsal-remove-confirm-button"
        destructive
        onClose={() => setRemoving(false)}
        onConfirm={() => (editing === null ? undefined : remove(editing.id))}
      >
        급여에서도 빠져요
      </Dialog>
    </Screen>
  );
}
