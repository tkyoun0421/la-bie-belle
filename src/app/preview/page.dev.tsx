"use client";

import {
  CONFIRMED_WITH_CHANGE,
  GENERAL_CONFIRMATION,
  TRAINEE_CONFIRMATION,
} from "@/entities/schedule/model/confirmation.mock";
import { HomeView } from "@/views/home/ui/HomeView";
import * as homeMocks from "@/views/home/ui/home.mock";
import { MoreView } from "@/views/more/ui/MoreView";
import { NotificationsView } from "@/views/notifications/ui/NotificationsView";
import * as notificationsMocks from "@/views/notifications/ui/notifications.mock";
import { PayView } from "@/views/pay/ui/PayView";
import * as payMocks from "@/views/pay/ui/pay.mock";
import { PreviewView, type PreviewScreen } from "@/views/preview/ui/PreviewView";
import { ScheduleDetailView } from "@/views/schedule-detail/ui/ScheduleDetailView";
import { ScheduleView } from "@/views/schedule/ui/ScheduleView";
import * as scheduleMocks from "@/views/schedule/ui/schedule.mock";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

const SCREENS: PreviewScreen[] = [
  {
    label: "홈",
    scenarios: [
      { label: "출근 가능", node: <HomeView model={homeMocks.HOME_CHECK_IN_AVAILABLE} /> },
      { label: "퇴근 가능", node: <HomeView model={homeMocks.HOME_CHECK_OUT_AVAILABLE} /> },
      { label: "마감 임박 신청", node: <HomeView model={homeMocks.HOME_DEADLINE_APPLICATION} /> },
      { label: "확정 변경 확인", node: <HomeView model={homeMocks.HOME_CONFIRMATION_CHANGE} /> },
      { label: "다음 근무", node: <HomeView model={homeMocks.HOME_NEXT_SHIFT} /> },
      { label: "빈 상태", node: <HomeView model={homeMocks.HOME_EMPTY} /> },
      { label: "GPS 확인 중", node: <HomeView model={homeMocks.HOME_ATTENDANCE_CHECKING} /> },
      { label: "GPS 성공", node: <HomeView model={homeMocks.HOME_ATTENDANCE_SUCCESS} /> },
      {
        label: "GPS 실패-권한 꺼짐",
        node: <HomeView model={homeMocks.HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED} />,
      },
      {
        label: "GPS 실패-정확도 낮음",
        node: <HomeView model={homeMocks.HOME_ATTENDANCE_FAILURE_LOW_ACCURACY} />,
      },
      {
        label: "GPS 실패-범위 밖",
        node: <HomeView model={homeMocks.HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE} />,
      },
    ],
  },
  {
    label: "일정",
    scenarios: [
      {
        label: "모집 혼합 월",
        node: <ScheduleView {...scheduleMocks.SCHEDULE_MIXED_MONTH} onOpenDetail={() => {}} />,
      },
      {
        label: "빈 월",
        node: <ScheduleView {...scheduleMocks.SCHEDULE_EMPTY_MONTH} onOpenDetail={() => {}} />,
      },
    ],
  },
  {
    label: "확정 상세",
    scenarios: [
      { label: "일반 확정", node: <ScheduleDetailView confirmation={GENERAL_CONFIRMATION} /> },
      { label: "변경 있음", node: <ScheduleDetailView confirmation={CONFIRMED_WITH_CHANGE} /> },
      { label: "교육생 포함", node: <ScheduleDetailView confirmation={TRAINEE_CONFIRMATION} /> },
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
    scenarios: [{ label: "기본", node: <MoreView /> }],
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
