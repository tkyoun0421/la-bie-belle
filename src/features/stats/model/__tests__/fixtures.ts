import type {
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/stats.type";

export const DAYS: WorkDay[] = [
  {
    id: "day-1",
    workDate: "2026-09-01",
    startsAt: "10:00:00",
    endsAt: "18:00:00",
  },
  {
    id: "day-2",
    workDate: "2026-09-02",
    startsAt: "09:00:00",
    endsAt: "17:00:00",
  },
  {
    id: "day-3",
    workDate: "2026-09-03",
    startsAt: "10:00:00",
    endsAt: "16:00:00",
  },
];

export const ASSIGNMENTS: WorkAssignment[] = [
  {
    id: "a1",
    dayId: "day-1",
    profileId: "p1",
    displayName: "김지우",
    position: "메인",
    kind: "regular",
    endedAt: null,
  },
  {
    id: "a2",
    dayId: "day-2",
    profileId: "p2",
    displayName: "박서연",
    position: "드레스실",
    kind: "regular",
    endedAt: null,
  },
  {
    id: "a3",
    dayId: "day-3",
    profileId: "p1",
    displayName: "김지우",
    position: "안내",
    kind: "training",
    endedAt: null,
  },
  {
    id: "a4",
    dayId: "day-2",
    profileId: "p3",
    displayName: "정하늘",
    position: "스캔",
    kind: "regular",
    endedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "a5",
    dayId: "day-1",
    profileId: "p4",
    displayName: "최윤아",
    position: "스캔",
    kind: "regular",
    endedAt: null,
  },
];
