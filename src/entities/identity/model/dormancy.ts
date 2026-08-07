import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

const SEOUL_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const STATUS_CONFLICT_PG_CODES = new Set(["LB010", "LB011"]);

type SeoulCalendarDate = { year: number; month: number; day: number };

function toSeoulCalendarDate(date: Date): SeoulCalendarDate {
  const parts = SEOUL_DATE_PARTS_FORMATTER.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

export function resolveAutoDepartureDate(anchor: Date | string): string {
  const anchorDate = typeof anchor === "string" ? new Date(anchor) : anchor;
  const { year, month, day } = toSeoulCalendarDate(anchorDate);
  const departure = new Date(Date.UTC(year + 1, month - 1, day));

  return `${departure.getUTCFullYear()}년 ${departure.getUTCMonth() + 1}월 ${departure.getUTCDate()}일`;
}

export function mapDormancyRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === "42501") {
    return ERROR_CODE.COMMON_FORBIDDEN;
  }
  if (pgCode !== undefined && STATUS_CONFLICT_PG_CODES.has(pgCode)) {
    return ERROR_CODE.IDENTITY_STATUS_CONFLICT;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
