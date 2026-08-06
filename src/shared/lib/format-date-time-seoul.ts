const SEOUL_DATE_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatDateTimeInSeoul(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const parts = SEOUL_DATE_TIME_PARTS_FORMATTER.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}.${lookup.month}.${lookup.day} ${lookup.hour}:${lookup.minute}`;
}
