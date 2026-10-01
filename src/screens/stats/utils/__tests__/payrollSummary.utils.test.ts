// 구현 대상: src/screens/stats/model/payrollSummary.ts (아직 없다)
//
// myPayrollSubtitle(days) — 근무자 급여 탭의 보조 줄이다(plan stats-worker
// AC-01, spec AC-04). 「근무 12건 · 108시간」 꼴이다.
//
// **급여 화면과 같은 셈이다**(stats.md 「내 급여」, payroll.md 「누적」의
// 「근무 회수와 시간 합」). 결근한 날(kind === 'absent')은 빠지고 시급이 아직
// 없는 날(kind === 'wage-pending')은 든다 — features/payroll을 features/stats가
// 부르면 lint 규칙 3 위반이라(plan stats-worker AC-01) 이 파일이 같은 셈을
// screens/stats 쪽에서 다시 세운다. 값은 features/payroll/model/payrollDays.ts가
// 낸 날짜별 분·kind를 그대로 받는다.
//
// days는 { minutes, kind }만 쓴다. kind는 payrollDays.ts의 PayrollDayKind —
// 'normal' | 'overtime' | 'absent' | 'wage-pending' 넷이다.

import { myPayrollSubtitle } from "@/screens/stats/utils/payrollSummary.utils";

function day(
  minutes: number,
  kind: "normal" | "overtime" | "absent" | "wage-pending",
) {
  return { minutes, kind };
}

describe("myPayrollSubtitle — 근무 회수와 시간 합이다(payroll.md 「누적」과 같은 셈)", () => {
  it("근무 12건이 6,480분(108시간)이면 '근무 12건 · 108시간'이다", () => {
    const days = Array.from({ length: 12 }, () => day(540, "normal"));

    expect(myPayrollSubtitle(days)).toBe("근무 12건 · 108시간");
  });

  it("분에 꼬리가 남으면 '7시간 30분'처럼 그대로 적는다", () => {
    const days = [day(450, "normal")];

    expect(myPayrollSubtitle(days)).toBe("근무 1건 · 7시간 30분");
  });
});

describe("myPayrollSubtitle — 결근한 날은 근무 회수·시간에서 빠진다", () => {
  it("결근한 날만 있으면 '근무 0건 · 0시간'이다", () => {
    const days = [day(0, "absent")];

    expect(myPayrollSubtitle(days)).toBe("근무 0건 · 0시간");
  });

  it("결근한 날과 정상 근무가 섞이면 결근만 빠진다", () => {
    const days = [day(480, "normal"), day(0, "absent")];

    expect(myPayrollSubtitle(days)).toBe("근무 1건 · 8시간");
  });
});

describe("myPayrollSubtitle — 시급이 아직 없는 날(wage-pending)은 든다", () => {
  it("금액이 0원인 wage-pending 날도 회수 1건·그 날 분만큼을 더한다", () => {
    const days = [day(480, "wage-pending")];

    expect(myPayrollSubtitle(days)).toBe("근무 1건 · 8시간");
  });
});

describe("myPayrollSubtitle — 배정이 하나도 없으면 '근무 0건 · 0시간'이다", () => {
  it("빈 배열이어도 –가 아니라 0으로 셈한다(빈 상태 자체는 화면이 따로 가른다)", () => {
    expect(myPayrollSubtitle([])).toBe("근무 0건 · 0시간");
  });
});
