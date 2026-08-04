/**
 * Single next action recommendation.
 *
 * The dashboard is advisory (ADR-0012): it reads the execution path of status,
 * approvals and dependencies and says what the pipeline allows next. It never
 * approves, never transitions state and never invents a candidate.
 */
import type { PlannedCandidate, ProgressSummary, TaskSummary } from "./progress.ts";

export type NextAction = {
  /** One sentence: the single next action. */
  readonly headline: string;
  readonly taskId: string | null;
  readonly rationale: string;
  readonly prerequisites: readonly string[];
  readonly blockers: readonly string[];
  readonly alternatives: readonly string[];
};

const MAX_ALTERNATIVES = 3;

function idsOf(tasks: readonly TaskSummary[]): string[] {
  return tasks.map((task) => task.id);
}

function alternativesOf(ids: readonly string[], chosen: string): string[] {
  return ids.filter((id) => id !== chosen).slice(0, MAX_ALTERNATIVES);
}

/** Blockers that are true regardless of which branch the recommendation takes. */
function standingBlockers(progress: ProgressSummary): string[] {
  const blocked = progress.blocked.map(
    (task) => `${task.id}가 blocked다. 인터뷰에서 결정을 해소해야 큐에 다시 들어간다.`,
  );
  const waiting = progress.waiting.flatMap((candidate: PlannedCandidate) => candidate.blockers);
  return [...blocked, ...waiting];
}

/**
 * Priority order: finish the running task, start a runnable `planned`, resolve a
 * `blocked` decision, then return to the design and planning interviews.
 */
export function recommendNextAction(progress: ProgressSummary): NextAction {
  const blockers = standingBlockers(progress);

  const running = progress.inProgress[0];
  if (running !== undefined) {
    return {
      headline: `${running.id} ${running.title}의 개발·검증·리팩토링을 마치고 done으로 전환한다.`,
      taskId: running.id,
      rationale: "in_progress task는 저장소 전체에서 하나뿐이며, 끝내기 전에는 다음 task를 시작할 수 없다.",
      prerequisites: [`${running.id}의 등록 check와 교차 검증 통과`],
      blockers,
      alternatives: alternativesOf(idsOf(progress.inProgress), running.id),
    };
  }

  const runnable = progress.runnable[0];
  if (runnable !== undefined) {
    const task = runnable.task;
    return {
      headline: `${task.id} ${task.title}을(를) in_progress로 두고 개발 단계를 시작한다.`,
      taskId: task.id,
      rationale: "두 승인과 실행 계약이 모두 있고 선행 task가 전부 done인 planned task 중 index 등록 순서로 가장 앞이다.",
      prerequisites: [
        `${task.id}의 RADIO 해시 확인(${task.radioRef ?? "radio_ref 없음"})`,
        task.dependsOn.length === 0 ? "선행 task 없음" : `선행 task ${task.dependsOn.join(", ")} 완료 확인`,
      ],
      blockers,
      alternatives: alternativesOf(
        progress.runnable.map((candidate) => candidate.task.id),
        task.id,
      ),
    };
  }

  const blocked = progress.blocked[0];
  if (blocked !== undefined) {
    return {
      headline: `${blocked.id} ${blocked.title}의 blocked 사유를 인터뷰에서 해소한다.`,
      taskId: blocked.id,
      rationale: "실행 가능한 planned task가 없고 중단된 task가 있다. 결정 해소가 큐를 다시 여는 유일한 경로다.",
      prerequisites: [`docs/execution/runs/${blocked.id}/decision-signal.json 확인`],
      blockers,
      alternatives: alternativesOf(idsOf(progress.blocked), blocked.id),
    };
  }

  const designPending = progress.designPending[0];
  if (designPending !== undefined) {
    return {
      headline: `${designPending.id} ${designPending.title}의 설계(RADIO) 인터뷰를 진행한다.`,
      taskId: designPending.id,
      rationale: "실행 큐가 비었고 기획 승인만 있는 task가 있다. RADIO 승인이 planned 진입 조건이다.",
      prerequisites: ["승인된 기획 범위 확인", "docs/execution/radio/<task-id>-radio.md 작성과 SHA-256 기록"],
      blockers,
      alternatives: alternativesOf(idsOf(progress.designPending), designPending.id),
    };
  }

  const proposed = progress.proposed[0];
  if (proposed !== undefined) {
    return {
      headline: `${proposed.id} ${proposed.title}의 기획 인터뷰를 진행한다.`,
      taskId: proposed.id,
      rationale: "승인된 task가 하나도 남지 않았다. 기획 승인이 파이프라인의 첫 관문이다.",
      prerequisites: ["제품 목표·비목표·인수 조건 확정", "product_approval 기록"],
      blockers,
      alternatives: alternativesOf(idsOf(progress.proposed), proposed.id),
    };
  }

  return {
    headline: "다음 행동을 판정할 task가 없다. index에 task가 없거나 모두 종료 상태다.",
    taskId: null,
    rationale: "실행 경로에 올릴 수 있는 task를 찾지 못했다. 값을 추정하지 않고 없음으로 표시한다.",
    prerequisites: [],
    blockers,
    alternatives: [],
  };
}
