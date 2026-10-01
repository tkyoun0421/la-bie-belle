/**
 * 생년월일을 만 나이와 함께 적는다 — 「1992년 3월 4일(34세)」다. 관리자가 실제로 쓰는 것은
 * 나이인데 저장하는 것은 생년월일이라 화면이 그 셈을 대신한다
 * (`docs/2-design/modules/account/screens/membersPending.md`의 「생년월일 옆에 나이를 같이
 * 적는다」).
 *
 * **나이는 생일이 지났는지로만 갈린다.** 월·일을 견줘 아직 안 왔으면 한 살 뺀다. 2월 29일생이
 * 평년에 3월 1일부터 한 살 더하는 것도 이 셈이 그대로 낸다 — 평년 2월 28일은 아직 2월 29일
 * 앞이고 3월 1일은 그 뒤다(한국 민법 해석).
 *
 * 오늘이 언제인지는 KST 달력일로 본다. 자정 직후에 열어도 어제 날짜로 세지 않는다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type CalendarDay = { year: number; month: number; day: number };

function kstCalendarDay(instant: string): CalendarDay {
  const shifted = new Date(Date.parse(instant) + KST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function parseIsoDate(isoDate: string): CalendarDay {
  const [year, month, day] = isoDate.split("-").map(Number);

  return { year, month, day };
}

function yearsBetween(birth: CalendarDay, today: CalendarDay): number {
  const passed =
    today.month > birth.month ||
    (today.month === birth.month && today.day >= birth.day);

  return today.year - birth.year - (passed ? 0 : 1);
}

export function formatBirthDate(birthDate: string, today: string): string {
  const birth = parseIsoDate(birthDate);
  const age = yearsBetween(birth, kstCalendarDay(today));

  return `${birth.year}년 ${birth.month}월 ${birth.day}일(${age}세)`;
}
