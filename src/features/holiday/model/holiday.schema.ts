export type HolidayApiEntry = {
  date: string;
  name: string;
};

const EIGHT_DIGIT_DATE = /^\d{8}$/;

const HOLIDAY_FLAG = "Y";

export function toIsoDate(rawDate: number | string): string {
  const digits = String(rawDate);

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function itemsOf(body: unknown): unknown[] | null {
  const envelope = asRecord(asRecord(asRecord(body)?.response)?.body);

  if (envelope === null) {
    return null;
  }

  if (envelope.items === "") {
    return [];
  }

  const item = asRecord(envelope.items)?.item;

  if (item === undefined) {
    return null;
  }

  return Array.isArray(item) ? item : [item];
}

function isEightDigitDate(value: unknown): value is number | string {
  return (
    (typeof value === "number" || typeof value === "string") &&
    EIGHT_DIGIT_DATE.test(String(value))
  );
}

export function parseHolidayApiResponse(body: unknown): HolidayApiEntry[] {
  const items = itemsOf(body);

  if (items === null) {
    return [];
  }

  const holidays: HolidayApiEntry[] = [];

  for (const entry of items) {
    const item = asRecord(entry);

    if (item === null) {
      return [];
    }

    if (item.isHoliday !== HOLIDAY_FLAG) {
      continue;
    }

    if (!isEightDigitDate(item.locdate) || typeof item.dateName !== "string") {
      return [];
    }

    holidays.push({ date: toIsoDate(item.locdate), name: item.dateName });
  }

  return holidays;
}
