import type { Violation } from "./violation.ts";

const GATE = "gate:motion-render-budget";

export const RENDER_BUDGET_MS = 16;

export type RenderBudgetMeasurement = {
  readonly fullMotionMs: number;
  readonly reducedMotionMs: number;
};

export function evaluateRenderBudget(
  measurement: RenderBudgetMeasurement,
  budgetMs: number = RENDER_BUDGET_MS,
): Violation[] {
  const diffMs = Math.abs(measurement.fullMotionMs - measurement.reducedMotionMs);
  if (diffMs <= budgetMs) {
    return [];
  }

  return [
    {
      gate: GATE,
      file: "src/views/notifications/ui/NotificationsView.tsx",
      message: `reduced-motion 대비 렌더 시간 차이가 ${diffMs.toFixed(1)}ms로 상한 ${budgetMs}ms를 넘었습니다 (전체 모션 ${measurement.fullMotionMs.toFixed(1)}ms / reduced-motion ${measurement.reducedMotionMs.toFixed(1)}ms).`,
      hint: "순차 등장이 CSS animation-delay 밖에서 메인 스레드 비용을 추가로 만들지 않는지 확인하세요.",
    },
  ];
}
