const KST_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

export function spellKstClock(instant: string | Date): string {
  return KST_CLOCK.format(
    instant instanceof Date ? instant : new Date(instant),
  );
}
