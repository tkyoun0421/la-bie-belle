export const APPLICATIONS_TABS = ["date", "person"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "date", label: "날짜순" },
  { value: "person", label: "사람순" },
];

export const APPLICATIONS_COPY = {
  changeDeadline: "마감일 바꾸기",
  empty: "아직 들어온 신청이 없어요",
} as const;
