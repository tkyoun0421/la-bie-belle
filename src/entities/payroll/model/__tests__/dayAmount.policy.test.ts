// 구현 대상: src/entities/payroll/model/dayAmount.policy.ts
//
// dayAmount({ minutes, wage }) — 540분까지 1배, 넘는 몫은 1.5배다(PAY-005·PAY-028).
// 0분은 결근이라 0원이고 kind가 'absent'다.

import { dayAmount } from "@/entities/payroll/model/dayAmount.policy";

const WAGE = 12000;

describe("dayAmount — 539분은 아직 전부 1배다(경계 직전)", () => {
  it("539분 전부가 1배로 계산된다", () => {
    expect(dayAmount({ minutes: 539, wage: WAGE })).toEqual({
      minutes: 539,
      amount: 107800,
      kind: "normal",
    });
  });
});

describe("dayAmount — 540분은 아직 1배다(경계 동일)", () => {
  it("540분까지는 연장이 안 붙는다", () => {
    expect(dayAmount({ minutes: 540, wage: WAGE })).toEqual({
      minutes: 540,
      amount: 108000,
      kind: "normal",
    });
  });
});

describe("dayAmount — 541분은 1분만 1.5배다(경계 직후)", () => {
  it("540분을 넘긴 1분부터 연장이 붙는다", () => {
    expect(dayAmount({ minutes: 541, wage: WAGE })).toEqual({
      minutes: 541,
      amount: 108300,
      kind: "overtime",
    });
  });
});

describe("dayAmount — 11시간(660분)이면 2시간(120분)이 1.5배다(PAY-028)", () => {
  it("배정 9시간과 리허설을 합쳐 11시간이면 2시간분만 연장이다", () => {
    expect(dayAmount({ minutes: 660, wage: WAGE })).toEqual({
      minutes: 660,
      amount: 144000,
      kind: "overtime",
    });
  });
});

describe("dayAmount — 0분은 결근이라 0원이다", () => {
  it("0분이면 금액도 0원이고 kind가 absent다", () => {
    expect(dayAmount({ minutes: 0, wage: WAGE })).toEqual({
      minutes: 0,
      amount: 0,
      kind: "absent",
    });
  });
});
