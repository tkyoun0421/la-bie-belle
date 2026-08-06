import type { AssignmentRosterRow } from "@/entities/schedule/model/assignment";

export const CONFIRMED_ROSTER: AssignmentRosterRow[] = [
  { name: "정하은", positions: ["플로어"], isTrainee: false, isMe: true },
  { name: "김민준", positions: ["플로어"], isTrainee: false, isMe: false },
  { name: "이서연", positions: ["주차"], isTrainee: false, isMe: false },
  { name: "박도윤", positions: ["플로어"], isTrainee: true, isMe: false },
];

export const NO_TRAINEE_ROSTER: AssignmentRosterRow[] = [
  { name: "정하은", positions: ["플로어"], isTrainee: false, isMe: true },
  { name: "김민준", positions: ["플로어"], isTrainee: false, isMe: false },
  { name: "이서연", positions: ["주차"], isTrainee: false, isMe: false },
];
