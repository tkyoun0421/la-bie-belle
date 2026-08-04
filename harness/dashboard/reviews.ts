import { isPlainObject } from "../lib/json-value.ts";

export const REVIEWS_DIRECTORY = "docs/execution/reviews";
export const BACKLOG_PATH = "docs/execution/reviews/backlog.md";

const REVIEW_FILE_NAME = /^(P[0-9]+-T[0-9]{2})-review\.json$/u;
const SCAN_FILE_NAME = /^scan-([0-9]{4}-[0-9]{2}-[0-9]{2})-review\.json$/u;
const TASK_ID = /^P[0-9]+-T[0-9]{2}$/u;
const COMMIT_SHA1 = /^[0-9a-f]{40}$/u;
const SCAN_SCOPE = "full-scan";
const SCAN_LABEL = "전체 스캔";

export const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export const REVIEW_AREAS = [
  "code_quality",
  "tests",
  "security",
  "performance",
  "architecture",
] as const;
export type ReviewArea = (typeof REVIEW_AREAS)[number];

export const AREA_LABELS: Readonly<Record<string, string>> = {
  code_quality: "코드 품질",
  tests: "테스트",
  security: "보안",
  performance: "성능",
  architecture: "아키텍처 정합",
};

const BACKLOG_SEVERITIES: readonly string[] = ["medium", "low"];
const REVIEWERS: readonly string[] = ["main", "codex", "opus", "opus-2"];
const REVIEWER_LIST = REVIEWERS.join("·");

export type ReviewFinding = {
  readonly id: string;
  readonly severity: Severity;
  readonly area: ReviewArea;
  readonly title: string;
  readonly description: string;
  readonly file: string;
  readonly agreedBy: readonly string[];
};

export type ReviewResult = {
  readonly taskId: string;
  readonly at: string;
  readonly baseCommit: string;
  readonly participants: readonly string[];
  readonly participantsNote: string;
  readonly scores: Readonly<Record<string, number>>;
  readonly scoreRationale: Readonly<Record<string, string>>;
  readonly total: number;
  readonly findings: readonly ReviewFinding[];
};

export type ReviewParse =
  | { readonly ok: true; readonly result: ReviewResult }
  | { readonly ok: false; readonly errors: readonly string[] };

export type ReviewDocument = {
  readonly file: string;
  readonly text: string;
};

export type BacklogItem = {
  readonly done: boolean;
  readonly severity: string;
  readonly taskId: string;
  readonly title: string;
  readonly file: string;
};

export type BacklogSummary = {
  readonly open: readonly BacklogItem[];
  readonly resolved: readonly BacklogItem[];
  readonly malformed: readonly string[];
};

export type SeverityGroup = {
  readonly severity: Severity;
  readonly findings: readonly ReviewFinding[];
};

export type ReviewsSummary = {
  readonly status: "none" | "ok";
  readonly latest: ReviewResult | null;
  readonly results: readonly { readonly file: string; readonly result: ReviewResult }[];
  readonly invalid: readonly { readonly file: string; readonly errors: readonly string[] }[];
  readonly findingsBySeverity: readonly SeverityGroup[];
  readonly backlog: BacklogSummary;
};

type ReviewSource =
  | { readonly kind: "task"; readonly taskId: string | null }
  | { readonly kind: "scan"; readonly date: string };

const UNNAMED_TASK_SOURCE: ReviewSource = { kind: "task", taskId: null };

function reviewSourceOf(fileName: string): ReviewSource | null {
  const task = REVIEW_FILE_NAME.exec(fileName);
  if (task !== null) {
    return { kind: "task", taskId: task[1] as string };
  }
  const scan = SCAN_FILE_NAME.exec(fileName);
  return scan === null ? null : { kind: "scan", date: scan[1] as string };
}

export function isReviewFileName(fileName: string): boolean {
  return reviewSourceOf(fileName) !== null;
}

function readString(
  source: Record<string, unknown>,
  key: string,
  errors: string[],
  prefix = "",
): string {
  const value = source[key];
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${prefix}${key}는 비어 있지 않은 문자열이어야 합니다.`);
    return "";
  }
  return value;
}

function readReviewerList(
  value: unknown,
  label: string,
  minimum: number,
  errors: string[],
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${label}는 배열이어야 합니다.`);
    return [];
  }
  const names = value.filter((entry): entry is string => typeof entry === "string");
  if (names.length !== value.length) {
    errors.push(`${label}의 원소는 문자열이어야 합니다.`);
  }
  if (new Set(names).size !== names.length) {
    errors.push(`${label}에 중복된 리뷰어가 있습니다.`);
  }
  for (const name of names) {
    if (!REVIEWERS.includes(name)) {
      errors.push(`${label}의 "${name}"은 ${REVIEWER_LIST} 중 하나가 아닙니다.`);
    }
  }
  if (names.length < minimum) {
    errors.push(`${label}는 ${minimum}명 이상이어야 합니다.`);
  }
  return names;
}

function readScores(value: unknown, errors: string[]): Record<string, number> {
  if (!isPlainObject(value)) {
    errors.push("scores는 5개 영역을 가진 객체여야 합니다.");
    return {};
  }
  const scores: Record<string, number> = {};
  for (const area of REVIEW_AREAS) {
    const score = value[area];
    if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) {
      errors.push(`scores.${area}는 0~100 정수여야 합니다.`);
      continue;
    }
    scores[area] = score;
  }
  for (const key of Object.keys(value)) {
    if (!REVIEW_AREAS.includes(key as ReviewArea)) {
      errors.push(`scores에 정의되지 않은 영역 "${key}"가 있습니다.`);
    }
  }
  return scores;
}

function readRationale(value: unknown, errors: string[]): Record<string, string> {
  if (!isPlainObject(value)) {
    errors.push("score_rationale은 5개 영역을 가진 객체여야 합니다.");
    return {};
  }
  const rationale: Record<string, string> = {};
  for (const area of REVIEW_AREAS) {
    const line = value[area];
    if (typeof line !== "string" || line.trim().length === 0) {
      errors.push(`score_rationale.${area}는 판정 근거 한 줄을 가져야 합니다.`);
      continue;
    }
    rationale[area] = line;
  }
  return rationale;
}

function readFinding(
  raw: unknown,
  position: number,
  participants: readonly string[] | null,
  errors: string[],
): ReviewFinding | null {
  const label = `findings[${position}]`;
  if (!isPlainObject(raw)) {
    errors.push(`${label}는 객체여야 합니다.`);
    return null;
  }
  const before = errors.length;
  const source = raw as Record<string, unknown>;
  const prefix = `${label}.`;
  const id = readString(source, "id", errors, prefix);
  const title = readString(source, "title", errors, prefix);
  const description = readString(source, "description", errors, prefix);
  const file = readString(source, "file", errors, prefix);

  const severity = source["severity"];
  if (typeof severity !== "string" || !SEVERITY_ORDER.includes(severity as Severity)) {
    errors.push(`${label}.severity는 critical·high·medium·low 중 하나여야 합니다.`);
  }
  const area = source["area"];
  if (typeof area !== "string" || !REVIEW_AREAS.includes(area as ReviewArea)) {
    errors.push(`${label}.area는 평가 영역 5개 중 하나여야 합니다.`);
  }
  const agreedBy = readReviewerList(source["agreed_by"], `${label}.agreed_by`, 2, errors);
  if (participants !== null) {
    for (const name of agreedBy) {
      if (!participants.includes(name)) {
        errors.push(`${label}.agreed_by의 "${name}"은 participants에 없는 리뷰어입니다.`);
      }
    }
  }

  if (errors.length !== before) {
    return null;
  }
  return {
    id,
    severity: severity as Severity,
    area: area as ReviewArea,
    title,
    description,
    file,
    agreedBy,
  };
}

function readIdentity(
  source: Record<string, unknown>,
  reviewSource: ReviewSource,
  errors: string[],
): string {
  const scope = source["scope"];
  if (reviewSource.kind === "scan") {
    if ("task_id" in source) {
      errors.push("수동 전체 스캔 결과 파일에는 task_id 대신 scope를 둡니다.");
    }
    if (scope !== SCAN_SCOPE) {
      errors.push(`수동 전체 스캔 결과 파일의 scope는 "${SCAN_SCOPE}"이어야 합니다.`);
    }
    return `${SCAN_LABEL} ${reviewSource.date}`;
  }

  if (scope !== undefined) {
    errors.push("scope는 수동 전체 스캔 결과 파일에만 쓰는 필드입니다.");
  }
  const taskId = readString(source, "task_id", errors);
  if (taskId.length === 0) {
    return taskId;
  }
  if (!TASK_ID.test(taskId)) {
    errors.push("task_id는 P[0-9]+-T[0-9]{2} 형식이어야 합니다.");
    return taskId;
  }
  if (reviewSource.taskId !== null && taskId !== reviewSource.taskId) {
    errors.push(`task_id는 파일 이름의 ${reviewSource.taskId}와 같아야 합니다.`);
  }
  return taskId;
}

function checkTotal(total: unknown, scores: Record<string, number>, errors: string[]): void {
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0 || total > 100) {
    errors.push("total은 0~100 정수여야 합니다.");
    return;
  }
  const values: number[] = [];
  for (const area of REVIEW_AREAS) {
    const score = scores[area];
    if (score === undefined) {
      return;
    }
    values.push(score);
  }
  const expected = Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
  if (total !== expected) {
    errors.push(`total은 5개 영역 점수의 평균을 반올림한 ${expected}이어야 합니다.`);
  }
}

export function parseReviewDocument(
  text: string,
  reviewSource: ReviewSource = UNNAMED_TASK_SOURCE,
): ReviewParse {
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch (error) {
    return { ok: false, errors: [`JSON 파싱 실패: ${(error as Error).message}`] };
  }
  if (!isPlainObject(decoded)) {
    return { ok: false, errors: ["결과 파일은 JSON 객체여야 합니다."] };
  }

  const source = decoded as Record<string, unknown>;
  const errors: string[] = [];

  const taskId = readIdentity(source, reviewSource, errors);
  const at = readString(source, "at", errors);
  if (at.length > 0 && Number.isNaN(Date.parse(at))) {
    errors.push("at은 ISO 8601 시각이어야 합니다.");
  }
  const baseCommit = readString(source, "base_commit", errors);
  if (baseCommit.length > 0 && !COMMIT_SHA1.test(baseCommit)) {
    errors.push("base_commit은 40자리 SHA-1이어야 합니다.");
  }

  const rawParticipants = source["participants"];
  const participants = readReviewerList(rawParticipants, "participants", 2, errors);
  const knownParticipants = Array.isArray(rawParticipants) ? participants : null;
  const participantsNote = source["participants_note"];
  if (typeof participantsNote !== "string") {
    errors.push("participants_note는 문자열이어야 합니다. 리뷰어 2자 전부면 빈 문자열입니다.");
  }

  const scores = readScores(source["scores"], errors);
  const scoreRationale = readRationale(source["score_rationale"], errors);

  const total = source["total"];
  checkTotal(total, scores, errors);

  const rawFindings = source["findings"];
  const findings: ReviewFinding[] = [];
  if (!Array.isArray(rawFindings)) {
    errors.push("findings는 배열이어야 합니다. 확정 발견이 없으면 빈 배열입니다.");
  } else {
    rawFindings.forEach((raw, position) => {
      const finding = readFinding(raw, position, knownParticipants, errors);
      if (finding !== null) {
        findings.push(finding);
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    result: {
      taskId,
      at,
      baseCommit,
      participants,
      participantsNote: participantsNote as string,
      scores,
      scoreRationale,
      total: total as number,
      findings,
    },
  };
}

const BACKLOG_LINE = /^-\s*\[( |x)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+?)\s+—\s+(\S.*)$/u;
const BACKLOG_CANDIDATE = /^-\s*\[( |x)\]/u;
const FENCE = /^\s*```/u;

export function parseBacklog(markdown: string | null): BacklogSummary {
  if (markdown === null) {
    return { open: [], resolved: [], malformed: [] };
  }
  const open: BacklogItem[] = [];
  const resolved: BacklogItem[] = [];
  const malformed: string[] = [];
  let insideFence = false;

  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence || !BACKLOG_CANDIDATE.test(line.trim())) {
      continue;
    }
    const parts = BACKLOG_LINE.exec(line.trim());
    const severity = parts?.[2] ?? "";
    const taskId = parts?.[3] ?? "";
    if (parts === null || !BACKLOG_SEVERITIES.includes(severity) || !TASK_ID.test(taskId)) {
      malformed.push(line.trim());
      continue;
    }
    const item: BacklogItem = {
      done: parts[1] === "x",
      severity,
      taskId,
      title: parts[4] ?? "",
      file: parts[5] ?? "",
    };
    (item.done ? resolved : open).push(item);
  }

  return { open, resolved, malformed };
}

function groupBySeverity(findings: readonly ReviewFinding[]): SeverityGroup[] {
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    findings: findings.filter((finding) => finding.severity === severity),
  })).filter((group) => group.findings.length > 0);
}

export function summarizeReviews(
  documents: readonly ReviewDocument[],
  backlogMarkdown: string | null,
): ReviewsSummary {
  const results: { file: string; result: ReviewResult }[] = [];
  const invalid: { file: string; errors: readonly string[] }[] = [];

  for (const document of documents) {
    const fileName = document.file.slice(document.file.lastIndexOf("/") + 1);
    const parsed = parseReviewDocument(
      document.text,
      reviewSourceOf(fileName) ?? UNNAMED_TASK_SOURCE,
    );
    if (parsed.ok) {
      results.push({ file: document.file, result: parsed.result });
    } else {
      invalid.push({ file: document.file, errors: parsed.errors });
    }
  }

  results.sort((left, right) => Date.parse(right.result.at) - Date.parse(left.result.at));
  const latest = results[0]?.result ?? null;

  return {
    status: latest === null ? "none" : "ok",
    latest,
    results,
    invalid,
    findingsBySeverity: latest === null ? [] : groupBySeverity(latest.findings),
    backlog: parseBacklog(backlogMarkdown),
  };
}
