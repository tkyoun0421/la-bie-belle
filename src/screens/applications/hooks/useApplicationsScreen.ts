import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
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

/**
 * 그 달 근무 신청을 두 방향으로 보는 화면의 controller다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 신청 모아보기 짜임」이고
 * 완료 조건은 `docs/2-design/spec/schedule-admin.md`의 AC-06이다.
 *
 * **탭은 그릴 것만 가르고 질의는 하나다.** 날짜순은 근무표를 짜는 손을 따라가고 사람순은
 * 「이 사람이 이번 달 며칠을 일할 수 있나」를 본다 — 같은 답을 두 방향으로 접을 뿐이라 탭을
 * 오가도 서버에 다시 안 묻는다. 그래서 로딩·빈 상태와 탭 둘이 `listState` 하나로 접힌다.
 *
 * **보던 달을 안 든다.** 이 화면에는 달을 옮기는 손이 없어 달을 정하는 것은 주소뿐이다 —
 * 상태로 들고 주소를 효과로 베끼면 둘이 어긋날 자리만 생긴다.
 *
 * **시트 열림은 화면 것이 아니다.** 저장이 끝나면 저절로 닫히고 실패하면 열린 채로 남아,
 * 열림이 통신 결과에 매여 있다.
 *
 * **서버 시계를 쓴다.** 마감까지 며칠 남았는지가 「지금」에 달려 있어 하루 밀린 기기에서
 * 남은 날이 어긋난다.
 *
 * **보낼 데는 안 든다.** 뒤로는 `.tsx`가 쥔다.
 */

export type ApplicationsTab = (typeof APPLICATIONS_TABS)[number];

export type ApplicationsListState = "loading" | "empty" | ApplicationsTab;

/** 날짜 묶음의 이름 한 줄이다 — 같은 이름이 한 날에 두 번 설 수 있어 자리로 열쇠를 짓는다. */
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
  /** 그 사람이 낸 날들이다 — 이미 한 줄의 글월이다. */
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
  client: DB,
  monthParam?: string,
): ApplicationsScreenController {
  const [tab, setTab] = useState<ApplicationsTab>(APPLICATIONS_TABS[0]);
  const [asking, setAsking] = useState(false);

  const clockOffset = serverClockStore((at) => at.offset);
  const now = new Date(nowWithOffset(Date.now(), clockOffset)).toISOString();
  const today = kstDateOf(now);
  const month = monthParam ?? monthOf(today);

  const { data: schedule } = useMonthWindowQuery(client, month);
  const { data: rows, isLoading } = useMonthAvailabilitiesQuery(client, month);

  const {
    mutate: sendDeadline,
    isPending: saving,
    isSuccess: saved,
    isError: failed,
    reset,
  } = useSetApplicationDeadlineMutation(client);

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
