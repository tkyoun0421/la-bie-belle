import type { NextAction } from "./next-action.ts";
import type { PhaseSummary, PlannedCandidate, ProgressSummary, TaskSummary } from "./progress.ts";
import { STATUS_LABELS } from "./progress.ts";
import type { BacklogItem, ReviewsSummary, SeverityGroup } from "./reviews.ts";
import { AREA_LABELS, REVIEW_AREAS } from "./reviews.ts";
import type { Readiness, ScoreSection } from "./rubric.ts";

export type DashboardView = {
  readonly generatedAt: string;
  readonly baseCommit: string | null;
  readonly baseCommitSubject: string | null;
  readonly workingTreeNote: string;
  readonly readiness: Readiness;
  readonly progress: ProgressSummary;
  readonly nextAction: NextAction;
  readonly reviews: ReviewsSummary;
  readonly notices: readonly string[];
};

export const DASHBOARD_PATH = "docs/execution/dashboard/index.html";

export const SECTION_TITLES = {
  progress: "진행도",
  readiness: "준비도 루브릭",
  reviews: "검증",
  nextAction: "다음 행동·차단",
} as const;

const MISSING = "누락";

const SEVERITY_LABELS: Readonly<Record<string, string>> = {
  critical: "critical (즉시 보고·blocked)",
  high: "high (즉시 보고)",
  medium: "medium (backlog)",
  low: "low (backlog)",
};

const GRADE_TONE: Readonly<Record<string, string>> = {
  우수: "success",
  양호: "action",
  주의: "warning",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

function list(items: readonly string[], emptyText: string): string {
  if (items.length === 0) {
    return emptyText.length === 0 ? "" : `<p class="empty">${escapeHtml(emptyText)}</p>`;
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function meter(rate: number): string {
  const clamped = Math.round(Math.max(0, Math.min(100, rate)));
  return `<span class="meter"><span class="meter-fill" style="width:${clamped}%"></span></span>`;
}

function taskLine(task: TaskSummary): string {
  const label = STATUS_LABELS[task.status] ?? task.status;
  return `<span class="mono">${escapeHtml(task.id)}</span> ${escapeHtml(task.title)} <span class="chip">${escapeHtml(label)}</span>`;
}

function header(view: DashboardView): string {
  const commit =
    view.baseCommit === null
      ? `<span class="missing">${MISSING}</span>`
      : `<span class="mono">${escapeHtml(view.baseCommit)}</span>${
          view.baseCommitSubject === null
            ? ""
            : `<span class="sub">${escapeHtml(view.baseCommitSubject)}</span>`
        }`;
  const notices =
    view.notices.length === 0
      ? ""
      : `<div class="notice"><p class="notice-title">수집 알림</p>${list([...view.notices], "")}</div>`;

  return `<header>
<p class="eyebrow">라비에벨 운영 대시보드 · 읽기 전용 파생물</p>
<h1>운영 의사결정 대시보드</h1>
<dl class="meta">
<div><dt>기준 시각</dt><dd class="mono">${escapeHtml(view.generatedAt)}</dd></div>
<div><dt>기준 커밋</dt><dd>${commit}</dd></div>
<div><dt>작업 트리</dt><dd>${escapeHtml(view.workingTreeNote)}</dd></div>
</dl>
${notices}
</header>`;
}

function nextActionSection(action: NextAction): string {
  const target =
    action.taskId === null ? "" : `<p class="target mono">${escapeHtml(action.taskId)}</p>`;
  return `<section id="next-action" class="card highlight">
<h2>${SECTION_TITLES.nextAction}</h2>
${target}
<p class="headline">${escapeHtml(action.headline)}</p>
<p class="rationale">${escapeHtml(action.rationale)}</p>
<h3>직접 선행 조건</h3>
${list([...action.prerequisites], "선행 조건 없음")}
<h3>차단 사유</h3>
${list([...action.blockers], "차단 사유 없음")}
<h3>대안 후보</h3>
${list([...action.alternatives], "대안 후보 없음")}
</section>`;
}

function scoreSection(section: ScoreSection): string {
  const items = section.items
    .map(
      (item) => `<li>
<p class="row"><span>${escapeHtml(item.label)}</span><span class="score mono">${item.earned}/${item.max}</span></p>
<p class="evidence">${escapeHtml(item.evidence)}</p>
</li>`,
    )
    .join("");
  return `<li class="rubric-area">
<p class="row"><strong>${escapeHtml(section.label)}</strong><span class="score mono">${section.earned}/${section.max}</span></p>
${meter(section.max === 0 ? 0 : (section.earned / section.max) * 100)}
<ul class="rubric-items">${items}</ul>
</li>`;
}

function readinessSection(readiness: Readiness): string {
  const tone = GRADE_TONE[readiness.grade] ?? "neutral";
  return `<section id="readiness" class="card">
<h2>${SECTION_TITLES.readiness}</h2>
<p class="total"><span class="total-score mono">${readiness.total}</span><span class="total-max">/100</span><span class="grade ${tone}">${escapeHtml(readiness.grade)}</span></p>
<p class="caption">등급 경계: 90 이상 우수, 70~89 양호, 70 미만 주의. 모든 점수는 아래 근거 수치로 기계 판정한다.</p>
<ul class="rubric">${readiness.sections.map(scoreSection).join("")}</ul>
</section>`;
}

function phaseRow(phase: PhaseSummary): string {
  return `<li>
<p class="row"><span><span class="mono">${escapeHtml(phase.id)}</span> ${escapeHtml(phase.title)}</span><span class="score mono">${phase.done}/${phase.total} · ${phase.rate}%</span></p>
${meter(phase.rate)}
</li>`;
}

function candidateDetail(candidate: PlannedCandidate): string {
  return `<li>${taskLine(candidate.task)}${list([...candidate.blockers], "차단 사유 없음")}</li>`;
}

function progressSection(progress: ProgressSummary): string {
  const statusChips = progress.statusCounts
    .map(
      (entry) =>
        `<li class="chip">${escapeHtml(STATUS_LABELS[entry.status] ?? entry.status)} <span class="mono">${entry.count}</span></li>`,
    )
    .join("");
  const inProgress =
    progress.inProgress.length === 0
      ? `<p class="empty">진행 중인 task 없음</p>`
      : `<ul class="plain">${progress.inProgress.map((task) => `<li>${taskLine(task)}</li>`).join("")}</ul>`;
  const nextCandidates =
    progress.runnable.length === 0
      ? `<p class="empty">실행 가능한 planned task 없음</p>`
      : `<ul class="plain">${progress.runnable.map((candidate) => `<li>${taskLine(candidate.task)}</li>`).join("")}</ul>`;
  const waitingDetail =
    progress.waiting.length === 0
      ? `<p class="empty">의존성 대기 중인 planned task 없음</p>`
      : `<ul class="plain">${progress.waiting.map(candidateDetail).join("")}</ul>`;

  return `<section id="progress" class="card">
<h2>${SECTION_TITLES.progress}</h2>
<p class="row"><strong>전체 완료율</strong><span class="score mono">${progress.doneTasks}/${progress.totalTasks} · ${progress.completionRate}%</span></p>
${meter(progress.completionRate)}
<h3>상태별 집계</h3>
<ul class="chips">${statusChips}</ul>
<h3>현재 진행</h3>
${inProgress}
<h3>다음 후보</h3>
${nextCandidates}
<details>
<summary>phase별 진행과 의존성 대기 상세</summary>
<h3>phase별 완료율</h3>
<ul class="plain">${progress.phases.map(phaseRow).join("")}</ul>
<h3>의존성·승인 대기</h3>
${waitingDetail}
</details>
</section>`;
}

function findingGroup(group: SeverityGroup): string {
  const items = group.findings
    .map(
      (finding) => `<li>
<p class="row"><span class="mono">${escapeHtml(finding.id)}</span><span class="chip">${escapeHtml(AREA_LABELS[finding.area] ?? finding.area)}</span></p>
<p class="finding-title">${escapeHtml(finding.title)}</p>
<p class="evidence">${escapeHtml(finding.description)}</p>
<p class="caption mono">${escapeHtml(finding.file)} · 인정 ${escapeHtml(finding.agreedBy.join(", "))}</p>
</li>`,
    )
    .join("");
  return `<div class="severity">
<h4>${escapeHtml(SEVERITY_LABELS[group.severity] ?? group.severity)} · ${group.findings.length}건</h4>
<ul class="plain">${items}</ul>
</div>`;
}

function reviewsBody(reviews: ReviewsSummary): string {
  const latest = reviews.latest;
  if (latest === null) {
    return `<p class="empty">결과 없음 — docs/execution/reviews/에 유효한 &lt;task-id&gt;-review.json이 없다.</p>`;
  }
  const scoreRows = REVIEW_AREAS.map((area) => {
    const score = latest.scores[area];
    return `<li>
<p class="row"><span>${escapeHtml(AREA_LABELS[area] ?? area)}</span><span class="score mono">${score === undefined ? MISSING : score}</span></p>
<p class="evidence">${escapeHtml(latest.scoreRationale[area] ?? MISSING)}</p>
</li>`;
  }).join("");

  return `<p class="row"><strong>최신 결과 <span class="mono">${escapeHtml(latest.taskId)}</span></strong><span class="score mono">종합 ${latest.total}</span></p>
<p class="caption mono">${escapeHtml(latest.at)} · 기준 커밋 ${escapeHtml(latest.baseCommit)} · 참여 ${escapeHtml(latest.participants.join(", "))}</p>
${latest.participantsNote.length === 0 ? "" : `<p class="caption">${escapeHtml(latest.participantsNote)}</p>`}
<ul class="plain">${scoreRows}</ul>
<h3>확정 발견</h3>
${
  reviews.findingsBySeverity.length === 0
    ? `<p class="empty">확정 발견 없음</p>`
    : reviews.findingsBySeverity.map(findingGroup).join("")
}`;
}

function backlogLine(item: BacklogItem): string {
  return `[${item.severity}] ${item.taskId} ${item.title} — ${item.file}`;
}

function reviewsSection(reviews: ReviewsSummary): string {
  const invalid =
    reviews.invalid.length === 0
      ? ""
      : `<div class="notice"><p class="notice-title">형식 오류 ${reviews.invalid.length}건</p><ul>${reviews.invalid
          .map(
            (entry) =>
              `<li><span class="mono">${escapeHtml(entry.file)}</span>${list([...entry.errors], "")}</li>`,
          )
          .join("")}</ul></div>`;

  const backlogItems = reviews.backlog.open.map(backlogLine);
  const malformed =
    reviews.backlog.malformed.length === 0
      ? ""
      : `<div class="notice"><p class="notice-title">backlog 형식 오류 ${reviews.backlog.malformed.length}건</p>${list(
          [...reviews.backlog.malformed],
          "",
        )}</div>`;

  return `<section id="reviews" class="card">
<h2>${SECTION_TITLES.reviews}</h2>
${invalid}
${reviewsBody(reviews)}
<h3>미완료 backlog</h3>
${list(backlogItems, "미완료 backlog 항목 없음")}
${malformed}
<details>
<summary>해결된 backlog ${reviews.backlog.resolved.length}건</summary>
${list(reviews.backlog.resolved.map(backlogLine), "해결 기록 없음")}
</details>
</section>`;
}

const STYLE = `:root{color-scheme:light;--ink:#0a0b0d;--muted:#5b616e;--line:#dee1e6;--surface:#f7f7f7;--action:#0052ff;--action-bg:#eef4ff;--success:#087a4b;--success-bg:#e8f8f1;--warning:#765500;--warning-bg:#fff7d6;--danger:#b01825;--danger-bg:#fff0f1}
*{box-sizing:border-box}
body{margin:0;padding:16px;background:#fff;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%}
main{display:flex;flex-direction:column;gap:16px}
h1{font-size:22px;line-height:1.36;margin:4px 0 12px}
h2{font-size:18px;line-height:1.44;margin:0 0 12px}
h3{font-size:14px;line-height:1.43;margin:16px 0 8px;color:var(--muted)}
h4{font-size:14px;line-height:1.43;margin:12px 0 4px}
p{margin:0 0 8px}
ul{margin:0 0 8px;padding-left:20px}
ul.plain,ul.chips,ul.rubric,ul.rubric-items{list-style:none;padding-left:0}
ul.plain>li,ul.rubric>li{padding:8px 0;border-top:1px solid var(--line)}
ul.rubric-items>li{padding:8px 0 0}
.eyebrow{font-size:13px;color:var(--muted);margin:0}
.card{border:1px solid var(--line);border-radius:12px;padding:16px;background:#fff}
.card.highlight{border-color:#b8ceff;background:var(--action-bg)}
.meta{display:flex;flex-direction:column;gap:4px;margin:0 0 12px;font-size:13px}
.meta div{display:flex;gap:8px;flex-wrap:wrap}
.meta dt{color:var(--muted);min-width:64px}
.meta dd{margin:0;word-break:break-all}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums}
.sub{display:block;color:var(--muted)}
.missing{color:var(--danger);font-weight:600}
.row{display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap}
.score{font-weight:600;white-space:nowrap}
.headline{font-size:18px;font-weight:600;line-height:1.44}
.rationale,.evidence{font-size:13px;color:var(--muted)}
.caption{font-size:13px;color:var(--muted)}
.target{font-size:13px;color:var(--action);font-weight:600;margin:0 0 4px}
.total{display:flex;align-items:baseline;gap:8px;margin:0 0 8px}
.total-score{font-size:32px;font-weight:700;line-height:1.25}
.total-max{color:var(--muted)}
.grade{margin-left:auto;padding:2px 10px;border-radius:999px;font-size:14px;font-weight:600}
.grade.success{color:var(--success);background:var(--success-bg)}
.grade.action{color:var(--action);background:var(--action-bg)}
.grade.warning{color:var(--warning);background:var(--warning-bg)}
.meter{display:block;height:6px;border-radius:999px;background:var(--surface);overflow:hidden}
.meter-fill{display:block;height:100%;background:var(--action)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-block;padding:2px 8px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:13px;white-space:nowrap}
.empty{font-size:13px;color:var(--muted)}
.notice{border:1px solid #efb4ba;background:var(--danger-bg);border-radius:8px;padding:12px;margin:0 0 12px}
.notice-title{font-weight:600;color:var(--danger);margin:0 0 4px}
.severity{margin:0 0 12px}
.finding-title{font-weight:600}
details{margin-top:12px;border-top:1px solid var(--line);padding-top:8px}
summary{cursor:pointer;font-size:14px;color:var(--action)}
footer{margin-top:16px;font-size:13px;color:var(--muted)}
@media (min-width:720px){body{max-width:880px;margin:0 auto;padding:32px}h1{font-size:26px}}`;

export function renderDashboard(view: DashboardView): string {
  const baseCommitMarker =
    view.baseCommit === null
      ? ""
      : `\n<meta name="base-commit" content="${escapeHtml(view.baseCommit)}">`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${baseCommitMarker}
<title>라비에벨 운영 의사결정 대시보드</title>
<style>${STYLE}</style>
</head>
<body>
${header(view)}
<main>
${nextActionSection(view.nextAction)}
${readinessSection(view.readiness)}
${progressSection(view.progress)}
${reviewsSection(view.reviews)}
</main>
<footer>
<p>생성 명령: pnpm dashboard · 정본: docs/execution/phases/index.jsonl, docs/execution/runs/, docs/execution/reviews/</p>
<p>이 문서는 읽기 전용 파생물이다. 승인·상태 전환·실행 제어를 수행하지 않는다.</p>
</footer>
</body>
</html>
`;
}
