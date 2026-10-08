import type {
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/stats.type";

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
