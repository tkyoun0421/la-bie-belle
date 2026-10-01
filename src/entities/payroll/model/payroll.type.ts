/**
 * 급여 도메인의 모양이다.
 */

/**
 * 그날이 급여에서 어떤 갈래인가다. 1배로 센 날과 연장이 든 날과 결근한 날 셋이고, 「시급이
 * 아직 없는 날」은 급여가 아니라 화면의 갈래라 `features/payrollCompute`가 이 셋에 하나를
 * 더해 쓴다.
 */
export type DayKind = "normal" | "overtime" | "absent";
