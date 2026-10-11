import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
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
  const read = useMonthAvailabilitiesQuery(supabase, month);

  return fragmentOf(read, {
    empty: (applications) => applications.length === 0,
    ready: (applications) => ({
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
    }),
  });
}
