import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { kstDateOf, monthOf } from "@/shared/utils/kstDate";
import { useMonthAvailabilitiesQuery } from "@/entities/availability/services/useMonthAvailabilitiesQuery";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useSetApplicationDeadlineMutation } from "@/features/availabilitySubmit/services/useSetApplicationDeadlineMutation";
import { APPLICATIONS_TABS } from "@/screens/applications/consts/applications.const";
import {
  applicationsDeadlineLine,
  applicationsEmptyDeadlineLine,
  applicationsTitle,
  groupApplicationsByDate,
  groupApplicationsByPerson,
  spellApplicationDate,
} from "@/screens/applications/utils/applicationsGrouping.utils";

export type ApplicationsTab = (typeof APPLICATIONS_TABS)[number];

export type ApplicationsListState = "loading" | "empty" | ApplicationsTab;

export type ApplicationsName = {
  key: string;
  name: string;
};

export type ApplicationsDateGroup = {
  key: string;
  heading: string;
  names: ApplicationsName[];
};

export type ApplicationsPersonGroup = {
  key: string;
  displayName: string;
  dates: string;
};

export type ApplicationsDeadlineSheet = {
  deadline: string;
  today: string;
};

export type ApplicationsScreenController = {
  title: string;
  tab: ApplicationsTab;
  deadlineLine: string | null;
  emptyDeadlineLine: string | null;
  listState: ApplicationsListState;
  dateGroups: ApplicationsDateGroup[];
  personGroups: ApplicationsPersonGroup[];
  sheet: ApplicationsDeadlineSheet | null;
  saving: boolean;
  failed: boolean;
  chooseTab: (value: string) => void;
  openDeadline: () => void;
  closeDeadline: () => void;
  saveDeadline: (deadline: string) => void;
};

function tabOf(value: string): ApplicationsTab {
  return APPLICATIONS_TABS.find((tab) => tab === value) ?? APPLICATIONS_TABS[0];
}

export function useApplicationsScreen(
  monthParam?: string,
): ApplicationsScreenController {
  const [tab, setTab] = useState<ApplicationsTab>(APPLICATIONS_TABS[0]);
  const [asking, setAsking] = useState(false);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();
  const today = kstDateOf(now);
  const month = monthParam ?? monthOf(today);

  const { data: schedule } = useMonthWindowQuery(supabase, month);
  const { data: rows, isLoading } = useMonthAvailabilitiesQuery(
    supabase,
    month,
  );

  const {
    mutate: sendDeadline,
    isPending: saving,
    isSuccess: saved,
    isError: failed,
    reset,
  } = useSetApplicationDeadlineMutation(supabase);

  const close = useCallback(() => {
    setAsking(false);
    reset();
  }, [reset]);

  useEffect(() => {
    if (saved) {
      close();
    }
  }, [saved, close]);

  const applications = rows ?? [];
  const deadline = schedule?.applicationDeadline ?? null;

  return {
    title: applicationsTitle(month),
    tab,
    deadlineLine:
      deadline === null
        ? null
        : applicationsDeadlineLine({ applicationDeadline: deadline, now }),
    emptyDeadlineLine:
      deadline === null ? null : applicationsEmptyDeadlineLine(deadline),
    listState: isLoading
      ? "loading"
      : applications.length === 0
        ? "empty"
        : tab,
    dateGroups: groupApplicationsByDate(applications).map((group) => ({
      key: group.workDate,
      heading: spellApplicationDate(group.workDate),
      names: group.names.map((name, at) => ({
        key: `${group.workDate}-${at}`,
        name,
      })),
    })),
    personGroups: groupApplicationsByPerson(applications).map((group) => ({
      key: group.profileId,
      displayName: group.displayName,
      dates: group.workDates.map(spellApplicationDate).join(", "),
    })),
    sheet: asking ? { deadline: deadline ?? today, today } : null,
    saving,
    failed,
    chooseTab: (value) => setTab(tabOf(value)),
    openDeadline: () => setAsking(true),
    closeDeadline: close,
    saveDeadline: (chosen) => sendDeadline({ month, deadline: chosen }),
  };
}
