import { type POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

/**
 * 근무표 도메인의 모양이다. 포지션 이름은 상수가 바탕이라 `consts`에서 받는다 — 목록을
 * 고치면 타입이 따라오고, 반대로는 안 된다.
 */

export type Position = (typeof POSITION_ORDER)[number];

/**
 * 그 달 근무표의 접수 창이다. 마감이 비면 아직 안 열린 달이고, 확정 시각이 비면 접수는
 * 끝났어도 확정 전이다 — 화면이 그 둘을 다르게 말한다.
 */
export type MonthWindow = {
  applicationDeadline: string | null;
  confirmedAt: string | null;
};
