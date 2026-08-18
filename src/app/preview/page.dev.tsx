"use client";

import {
  CONFIRMED_ROSTER_GENERAL,
  CONFIRMED_ROSTER_UNASSIGNED,
  CONFIRMED_ROSTER_WITH_TRAINEE,
} from "@/entities/schedule/model/confirmed-roster.mock";
import type { ConfirmedRoster } from "@/entities/schedule/model/confirmed-roster";
import { HomeView } from "@/views/home/ui/HomeView";
import * as homeMocks from "@/views/home/ui/home.mock";
import { MoreView } from "@/views/more/ui/MoreView";
import { NotificationsView } from "@/views/notifications/ui/NotificationsView";
import * as notificationsMocks from "@/views/notifications/ui/notifications.mock";
import { PayView } from "@/views/pay/ui/PayView";
import * as payMocks from "@/views/pay/ui/pay.mock";
import { PreviewView, type PreviewScreen } from "@/views/preview/ui/PreviewView";
import {
  buildRosterGroups,
  deriveMyRosterPositions,
} from "@/views/schedule-detail/model/roster-groups";
import { ScheduleDetailView } from "@/views/schedule-detail/ui/ScheduleDetailView";
import { ScheduleView } from "@/views/schedule/ui/ScheduleView";
import * as scheduleMocks from "@/views/schedule/ui/schedule.mock";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

function scheduleDetailPreviewProps(workDate: string, roster: ConfirmedRoster) {
  return {
    workDate,
    plannedCheckin: roster.plannedCheckin,
    plannedCheckout: roster.plannedCheckout,
    ceremonyTimes: roster.ceremonyTimes,
    groups: buildRosterGroups(roster.roster),
    myPositions: deriveMyRosterPositions(roster.roster),
  };
}

const SCREENS: PreviewScreen[] = [
  {
    label: "홈",
    scenarios: [
      { label: "기본", node: <HomeView {...homeMocks.HOME_BASIC} /> },
      { label: "인증 창 열리기 전", node: <HomeView {...homeMocks.HOME_BEFORE_WINDOW} /> },
      { label: "인증 창 열린 뒤", node: <HomeView {...homeMocks.HOME_WINDOW_OPEN} /> },
      { label: "예정 시각 초과", node: <HomeView {...homeMocks.HOME_OVERDUE} /> },
      { label: "근무 없는 날", node: <HomeView {...homeMocks.HOME_NO_SHIFT_TODAY} /> },
      { label: "전부 빈 날", node: <HomeView {...homeMocks.HOME_ALL_EMPTY} /> },
      { label: "로딩", node: <HomeView {...homeMocks.HOME_LOADING} /> },
      { label: "부분 실패", node: <HomeView {...homeMocks.HOME_PARTIAL_FAILURE} /> },
      { label: "전부 실패", node: <HomeView {...homeMocks.HOME_ALL_FAILED} /> },
    ],
  },
  {
    label: "일정",
    scenarios: [
      {
        label: "모집 혼합 월",
        node: <ScheduleView {...scheduleMocks.SCHEDULE_MIXED_MONTH} />,
      },
      {
        label: "빈 월",
        node: <ScheduleView {...scheduleMocks.SCHEDULE_EMPTY_MONTH} />,
      },
    ],
  },
  {
    label: "확정 상세",
    scenarios: [
      {
        label: "일반 확정",
        node: (
          <ScheduleDetailView
            {...scheduleDetailPreviewProps("2026-08-09", CONFIRMED_ROSTER_GENERAL)}
          />
        ),
      },
      {
        label: "교육생 포함",
        node: (
          <ScheduleDetailView
            {...scheduleDetailPreviewProps("2026-08-16", CONFIRMED_ROSTER_WITH_TRAINEE)}
          />
        ),
      },
      {
        label: "미배정",
        node: (
          <ScheduleDetailView
            {...scheduleDetailPreviewProps("2026-08-23", CONFIRMED_ROSTER_UNASSIGNED)}
          />
        ),
      },
    ],
  },
  {
    label: "예상 급여",
    scenarios: [
      { label: "내역 있음", node: <PayView {...payMocks.PAY_WITH_ITEMS} /> },
      { label: "빈 달", node: <PayView {...payMocks.PAY_EMPTY_MONTH} /> },
      { label: "리허설 포함", node: <PayView {...payMocks.PAY_WITH_HEAVY_REHEARSAL} /> },
    ],
  },
  {
    label: "알림함",
    scenarios: [
      {
        label: "혼합",
        node: (
          <NotificationsView {...notificationsMocks.NOTIFICATIONS_MIXED} onNavigate={() => {}} />
        ),
      },
      {
        label: "전체 읽음",
        node: (
          <NotificationsView {...notificationsMocks.NOTIFICATIONS_ALL_READ} onNavigate={() => {}} />
        ),
      },
      {
        label: "빈 상태",
        node: (
          <NotificationsView {...notificationsMocks.NOTIFICATIONS_EMPTY} onNavigate={() => {}} />
        ),
      },
    ],
  },
  {
    label: "전체",
    scenarios: [
      {
        label: "기본",
        node: <MoreView onSignOut={async () => ({ ok: true })} roles={[]} />,
      },
      {
        label: "관리자",
        node: <MoreView onSignOut={async () => ({ ok: true })} roles={["worker", "admin"]} />,
      },
    ],
  },
  {
    label: "공통",
    scenarios: [
      {
        label: "로딩",
        node: (
          <main
            role="status"
            aria-live="polite"
            className="flex min-h-dvh items-center justify-center p-6"
          >
            <p className="typo-body text-text">불러오는 중이에요…</p>
          </main>
        ),
      },
      { label: "오류", node: <ErrorScreen /> },
    ],
  },
];

export default function PreviewPage() {
  return <PreviewView screens={SCREENS} />;
}
