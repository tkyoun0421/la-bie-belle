export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "date", label: "날짜순" },
  { value: "person", label: "사람순" },
];

export const SKELETON_ROWS = [0, 1, 2] as const;

export const APPLICATIONS_COPY = {
  empty: "아직 들어온 신청이 없어요",
} as const;
