/**
 * 공공 API(한국천문연구원 특일 정보)의 응답을 `import_holidays`가 받는 `{ holiday_date, name }`
 * 꼴로 옮긴다(payroll/design.md 「공휴일 받기」).
 *
 * **밖에서 온 것을 받는 유일한 문이라 던지지 않는다.** `import-holidays` Edge Function이 이
 * 함수를 부르고 그 위에서 판단을 안 하니, 모양이 어긋나면 예외 대신 빈 배열이다 — 던지면
 * 함수가 통째로 죽고 그 해가 영영 안 들어온다.
 *
 * 방어하는 모양이 다섯이다(payroll-holidays plan 「공공 API의 모양」).
 *
 * - 봉투가 `response.body.items.item`으로 세 겹이고 중간이 통째로 빠질 수 있다
 * - 항목이 하나면 `item`이 배열이 아니라 객체 하나로 온다
 * - 결과가 없으면 `items`가 빈 객체가 아니라 빈 문자열로 올 수 있다
 * - `locdate`가 문자열이 아니라 숫자다(`20261003`)
 * - 절기와 기념일이 섞여 오고 그것들은 `isHoliday`가 `"N"`이다
 *
 * **한 항목이라도 모양이 어긋나면 그 응답을 통째로 버린다.** 어긋난 항목만 빼면 반쪽짜리
 * 한 해가 조용히 들어가고, `import_holidays`가 그 해의 `api` 행을 지우고 새로 넣어 멀쩡하던
 * 날들이 사라진다. 받는 쪽은 「다 읽었거나 아무것도 못 읽었거나」 둘만 본다.
 */

export type HolidayRow = {
  holiday_date: string;
  name: string;
};

const EIGHT_DIGIT_DATE = /^\d{8}$/;

const HOLIDAY_FLAG = "Y";

/** `locdate`는 `20261003` 꼴 여덟 자리다. 그 꼴인지는 부르는 쪽이 먼저 본다. */
export function toIsoDate(rawDate: number | string): string {
  const digits = String(rawDate);

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** 읽어낸 항목 목록이다. 봉투를 못 읽으면 빈 배열이 아니라 `null`이다. */
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

export function parseHolidayApiResponse(body: unknown): HolidayRow[] {
  const items = itemsOf(body);

  if (items === null) {
    return [];
  }

  const rows: HolidayRow[] = [];

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

    rows.push({ holiday_date: toIsoDate(item.locdate), name: item.dateName });
  }

  return rows;
}
