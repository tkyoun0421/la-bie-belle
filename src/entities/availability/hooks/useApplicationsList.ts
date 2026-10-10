import { supabase } from "@/shared/api/supabase";
import type { APPLICATIONS_TABS } from "@/entities/availability/consts/availability.const";
import { useMonthAvailabilitiesQuery } from "@/entities/availability/services/useMonthAvailabilitiesQuery";
import {
  groupApplicationsByDate,
  groupApplicationsByPerson,
  spellApplicationDate,
} from "@/entities/availability/utils/applicationsGrouping.utils";

export type ApplicationsTab = (typeof APPLICATIONS_TABS)[number];

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

export type ApplicationsListInput = {
  month: string;
  tab: ApplicationsTab;
};

export type ApplicationsListController =
  | { state: "pending" }
  | { state: "failed" }
  | { state: "empty" }
  | {
      state: "ready";
      tab: ApplicationsTab;
      dateGroups: ApplicationsDateGroup[];
      personGroups: ApplicationsPersonGroup[];
    };

export function useApplicationsList({
  month,
  tab,
}: ApplicationsListInput): ApplicationsListController {
  const { data, error } = useMonthAvailabilitiesQuery(supabase, month);

  const applications = data ?? [];

  if (error !== null) {
    return { state: "failed" };
  }

  if (data === undefined) {
    return { state: "pending" };
  }

  if (applications.length === 0) {
    return { state: "empty" };
  }

  return {
    state: "ready",
    tab,
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
  };
}
