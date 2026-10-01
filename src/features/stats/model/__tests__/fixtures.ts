// work-totals.test.ts와 person-days.test.ts가 나눠 쓰는 픽스처다. 두 함수가 같은
// 입력에서 같은 값을 내는지 맞춰 보려면 두 테스트가 서로 다른 데이터를 만들면 안 된다.
//
// WorkAssignment·WorkDay는 src/features/stats/model/workTotals.policy.ts가 정하는 입력
// 모양과 같다 — day-2의 자리는 "드레스실"·"대기실" 겸임 자리였다고 가정하고, a2의
// position은 이미 앞 포지션("드레스실")으로 해소되어 있다. 최윤아(p4)는 이 달 근무
// 뒤 퇴사한 사람이라고 가정한다.

import type {
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/workTotals.policy";

export const DAYS: WorkDay[] = [
  {
    id: "day-1",
    work_date: "2026-09-01",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
  },
  {
    id: "day-2",
    work_date: "2026-09-02",
    starts_at: "09:00:00",
    ends_at: "17:00:00",
  },
  {
    id: "day-3",
    work_date: "2026-09-03",
    starts_at: "10:00:00",
    ends_at: "16:00:00",
  },
];

export const ASSIGNMENTS: WorkAssignment[] = [
  {
    id: "a1",
    day_id: "day-1",
    profile_id: "p1",
    display_name: "김지우",
    position: "메인",
    kind: "regular",
    ended_at: null,
  },
  {
    id: "a2",
    day_id: "day-2",
    profile_id: "p2",
    display_name: "박서연",
    position: "드레스실",
    kind: "regular",
    ended_at: null,
  },
  {
    id: "a3",
    day_id: "day-3",
    profile_id: "p1",
    display_name: "김지우",
    position: "안내",
    kind: "training",
    ended_at: null,
  },
  {
    id: "a4",
    day_id: "day-2",
    profile_id: "p3",
    display_name: "정하늘",
    position: "스캔",
    kind: "regular",
    ended_at: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "a5",
    day_id: "day-1",
    profile_id: "p4",
    display_name: "최윤아",
    position: "스캔",
    kind: "regular",
    ended_at: null,
  },
];
