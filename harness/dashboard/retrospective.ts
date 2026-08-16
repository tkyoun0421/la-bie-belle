import { readdirSync } from "node:fs";
import { readTextFile, repoPath } from "../lib/repo.ts";
import { escapeHtml, STYLE } from "./render.ts";

export const RETROSPECTIVE_PAGE_PATH = "docs/execution/dashboard/retrospective.html";
export const COACHING_PAGE_PATH = "docs/execution/dashboard/coaching.html";

const CASES_PATH = "docs/execution/retrospective/cases.md";
const PROPOSALS_PATH = "docs/execution/retrospective/proposals.md";
const COACHING_DIRECTORY = "docs/execution/coaching";

const MISSING = "누락";

export type RetrospectiveCase = {
  readonly taskId: string;
  readonly outcome: "성공" | "실패" | "미상";
  readonly summary: string;
  readonly evidence: string;
};

export type RetrospectiveProposal = {
  readonly done: boolean;
  readonly summary: string;
  readonly source: string;
};

export type RetrospectiveView = {
  readonly casesAvailable: boolean;
  readonly proposalsAvailable: boolean;
  readonly cases: readonly RetrospectiveCase[];
  readonly proposals: readonly RetrospectiveProposal[];
  readonly malformed: readonly string[];
};

export type CoachingRun = {
  readonly file: string;
  readonly label: string;
};

export type CoachingSuggestion = {
  readonly severity: string;
  readonly summary: string;
};

export type CoachingView = {
  readonly available: boolean;
  readonly latest: CoachingRun | null;
  readonly history: readonly CoachingRun[];
  readonly suggestions: readonly CoachingSuggestion[];
};

const SEVERITY_ORDER: readonly string[] = ["critical", "high", "medium", "low"];

function bulletLines(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function readOutcome(value: string): RetrospectiveCase["outcome"] {
  if (value === "성공" || value === "실패") {
    return value;
  }
  return "미상";
}

export function parseCases(markdown: string): {
  cases: RetrospectiveCase[];
  malformed: string[];
} {
  const cases: RetrospectiveCase[] = [];
  const malformed: string[] = [];

  for (const line of bulletLines(markdown)) {
    const fields = line.split("|").map((field) => field.trim());
    if (fields.length < 3) {
      malformed.push(line);
      continue;
    }
    const [taskId, outcome, summary, evidence] = fields;
    if (taskId === undefined || outcome === undefined || summary === undefined) {
      malformed.push(line);
      continue;
    }
    cases.push({
      taskId,
      outcome: readOutcome(outcome),
      summary,
      evidence: evidence ?? "",
    });
  }

  return { cases, malformed };
}

export function parseProposals(markdown: string): RetrospectiveProposal[] {
  return bulletLines(markdown)
    .filter((line) => line.startsWith("[ ]") || line.startsWith("[x]"))
    .map((line) => {
      const done = line.startsWith("[x]");
      const fields = line.slice(3).trim().split("|").map((field) => field.trim());
      return {
        done,
        summary: fields[0] ?? "",
        source: fields.slice(1).join(" · "),
      };
    });
}

export function collectRetrospective(root: string): RetrospectiveView {
  const casesText = readTextFile(root, CASES_PATH);
  const proposalsText = readTextFile(root, PROPOSALS_PATH);
  const parsed = casesText === null ? { cases: [], malformed: [] } : parseCases(casesText);

  return {
    casesAvailable: casesText !== null,
    proposalsAvailable: proposalsText !== null,
    cases: parsed.cases,
    proposals: proposalsText === null ? [] : parseProposals(proposalsText),
    malformed: parsed.malformed,
  };
}

export function parseCoachingSuggestions(markdown: string): CoachingSuggestion[] {
  const suggestions: CoachingSuggestion[] = [];
  let severity = "";

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    const heading = /^#{2,3}\s+(.+)$/u.exec(line);
    if (heading !== null) {
      const label = (heading[1] ?? "").toLowerCase();
      severity = SEVERITY_ORDER.find((candidate) => label.includes(candidate)) ?? "";
      continue;
    }
    if (severity.length === 0 || !line.startsWith("- ")) {
      continue;
    }
    suggestions.push({ severity, summary: line.slice(2).trim() });
  }

  return suggestions.sort(
    (left, right) =>
      SEVERITY_ORDER.indexOf(left.severity) - SEVERITY_ORDER.indexOf(right.severity),
  );
}

function listCoachingFiles(root: string): string[] {
  try {
    return readdirSync(repoPath(root, COACHING_DIRECTORY))
      .filter((name) => name.endsWith(".md") && name !== "README.md")
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function collectCoaching(root: string): CoachingView {
  const files = listCoachingFiles(root);
  const history = files.map((file) => ({ file, label: file.replace(/\.md$/u, "") }));
  const latest = history[0] ?? null;
  const latestText = latest === null ? null : readTextFile(root, `${COACHING_DIRECTORY}/${latest.file}`);

  return {
    available: latest !== null && latestText !== null,
    latest,
    history,
    suggestions: latestText === null ? [] : parseCoachingSuggestions(latestText),
  };
}

function missingNotice(label: string): string {
  return `<p class="missing">${escapeHtml(label)} ${MISSING}</p>`;
}

function page(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<p class="eyebrow"><a href="index.html">운영 대시보드로</a></p>
<h1>${escapeHtml(title)}</h1>
<main>
${bodyHtml}
</main>
<footer>
<p>생성 명령: pnpm dashboard</p>
<p>이 문서는 읽기 전용 파생물이다. 정본을 고치지 않는다.</p>
</footer>
</body>
</html>
`;
}

function caseLine(entry: RetrospectiveCase): string {
  const evidence =
    entry.evidence.length === 0
      ? ""
      : `<p class="caption mono">${escapeHtml(entry.evidence)}</p>`;
  return `<li>
<p class="row"><span class="mono">${escapeHtml(entry.taskId)}</span><span class="chip">${escapeHtml(entry.outcome)}</span></p>
<p>${escapeHtml(entry.summary)}</p>
${evidence}
</li>`;
}

export function renderRetrospectivePage(view: RetrospectiveView): string {
  const successCount = view.cases.filter((entry) => entry.outcome === "성공").length;
  const failureCount = view.cases.filter((entry) => entry.outcome === "실패").length;
  const unknownCount = view.cases.length - successCount - failureCount;
  const openProposals = view.proposals.filter((proposal) => !proposal.done);

  const summary = view.casesAvailable
    ? `<ul class="chips">
<li class="chip">전체 <span class="mono">${view.cases.length}</span></li>
<li class="chip">성공 <span class="mono">${successCount}</span></li>
<li class="chip">실패 <span class="mono">${failureCount}</span></li>
<li class="chip">미상 <span class="mono">${unknownCount}</span></li>
</ul>`
    : missingNotice("cases.md");

  const caseList =
    view.cases.length === 0
      ? '<p class="empty">회고 항목 없음</p>'
      : `<ul class="plain">${view.cases.map(caseLine).join("")}</ul>`;

  const malformed =
    view.malformed.length === 0
      ? ""
      : `<div class="notice"><p class="notice-title">형식 오류 ${view.malformed.length}건</p><ul>${view.malformed
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul></div>`;

  const proposalList = !view.proposalsAvailable
    ? missingNotice("proposals.md")
    : openProposals.length === 0
      ? '<p class="empty">미결 제안 없음</p>'
      : `<ul class="plain">${openProposals
          .map(
            (proposal) =>
              `<li><p>${escapeHtml(proposal.summary)}</p><p class="caption mono">${escapeHtml(proposal.source)}</p></li>`,
          )
          .join("")}</ul>`;

  return page(
    "회고",
    `<section class="card">
<h2>집계</h2>
${summary}
</section>
<section class="card">
<h2>task별 회고</h2>
${malformed}
${caseList}
</section>
<section class="card">
<h2>미결 제안</h2>
${proposalList}
</section>`,
  );
}

export function renderCoachingPage(view: CoachingView): string {
  const latest = !view.available
    ? missingNotice("코칭 결과")
    : `<p class="row"><strong>최신 결과</strong><span class="mono">${escapeHtml(view.latest?.label ?? "")}</span></p>`;

  const suggestions =
    view.suggestions.length === 0
      ? '<p class="empty">제안 없음</p>'
      : `<ul class="plain">${view.suggestions
          .map(
            (suggestion) =>
              `<li><p class="row"><span class="chip">${escapeHtml(suggestion.severity)}</span></p><p>${escapeHtml(suggestion.summary)}</p></li>`,
          )
          .join("")}</ul>`;

  const history =
    view.history.length === 0
      ? '<p class="empty">실행 이력 없음</p>'
      : `<ul>${view.history
          .map((run) => `<li class="mono">${escapeHtml(run.label)}</li>`)
          .join("")}</ul>`;

  return page(
    "코칭",
    `<section class="card">
<h2>최신 실행</h2>
${latest}
</section>
<section class="card">
<h2>중요도순 제안</h2>
${suggestions}
</section>
<section class="card">
<h2>실행 이력</h2>
${history}
</section>`,
  );
}
