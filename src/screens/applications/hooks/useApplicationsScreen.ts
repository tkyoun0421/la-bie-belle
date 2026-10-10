import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { kstDateOf, monthOf } from "@/shared/utils/kstDate";
import { APPLICATIONS_TABS } from "@/entities/availability/consts/availability.const";
import type { ApplicationsTab } from "@/entities/availability/hooks/useApplicationsList";
import {
  applicationsDeadlineLine,
  applicationsEmptyDeadlineLine,
  applicationsTitle,
} from "@/entities/availability/utils/applicationsGrouping.utils";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { DEADLINE_SHEET_COPY } from "@/features/availabilitySubmit/consts/availabilitySubmit.const";
import { useSetApplicationDeadlineMutation } from "@/features/availabilitySubmit/services/useSetApplicationDeadlineMutation";

export type ApplicationsDeadlineSheet = {
  deadline: string;
  today: string;
  canSave: boolean;
};

export type ApplicationsScreenController = {
  goBack: () => void;
  month: string;
  title: string;
  tab: ApplicationsTab;
  deadlineLine: string | null;
  emptyDeadlineLine: string | null;
  sheet: ApplicationsDeadlineSheet | null;
  saving: boolean;
  failed: boolean;
  failedLine: string | null;
  chooseTab: (value: string) => void;
  openDeadline: () => void;
  closeDeadline: () => void;
  changeDeadlineDraft: (typed: string) => void;
  saveDeadline: () => void;
};

function tabOf(value: string): ApplicationsTab {
  return APPLICATIONS_TABS.find((tab) => tab === value) ?? APPLICATIONS_TABS[0];
}

export function useApplicationsScreen(
  monthParam?: string,
): ApplicationsScreenController {
  const router = useRouter();
  const [tab, setTab] = useState<ApplicationsTab>(APPLICATIONS_TABS[0]);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();
  const today = kstDateOf(now);
  const month = monthParam ?? monthOf(today);

  const { data: schedule } = useMonthWindowQuery(supabase, month);

  const {
    mutate: sendDeadline,
    isPending: saving,
    isSuccess: saved,
    isError: failed,
    reset,
  } = useSetApplicationDeadlineMutation(supabase);

  const close = useCallback(() => {
    setAsking(false);
    setDraft(null);
    reset();
  }, [reset]);

  useEffect(() => {
    if (saved) {
      close();
    }
  }, [saved, close]);

  const deadline = schedule?.applicationDeadline ?? null;
  const typed = draft ?? deadline ?? today;

  const goBack = useCallback(() => router.back(), [router]);

  return {
    goBack,
    month,
    title: applicationsTitle(month),
    tab,
    deadlineLine:
      deadline === null
        ? null
        : applicationsDeadlineLine({ applicationDeadline: deadline, now }),
    emptyDeadlineLine:
      deadline === null ? null : applicationsEmptyDeadlineLine(deadline),
    sheet: asking ? { deadline: typed, today, canSave: typed >= today } : null,
    saving,
    failed,
    failedLine: failed ? DEADLINE_SHEET_COPY.saveFailed : null,
    chooseTab: (value) => setTab(tabOf(value)),
    openDeadline: () => setAsking(true),
    closeDeadline: close,
    changeDeadlineDraft: setDraft,
    saveDeadline: () => sendDeadline({ month, deadline: typed }),
  };
}
