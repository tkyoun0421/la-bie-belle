const SEOUL_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatTimeInSeoul(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return SEOUL_TIME_FORMATTER.format(date);
}
