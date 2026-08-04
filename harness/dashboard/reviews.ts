/**
 * Parser for the cross review results owned by docs/workflow/REVIEW.md.
 *
 * The dashboard only displays these files, so every rule here is a read side
 * check: a malformed result must be reported as a format error instead of
 * failing generation or being silently repaired.
 */
import { isPlainObject } from "../lib/json-value.ts";

export const REVIEWS_DIRECTORY = "docs/execution/reviews";
export const BACKLOG_PATH = "docs/execution/reviews/backlog.md";

/** Only `<task-id>-review.json` files are real results (REVIEW.md 결과 파일 형식). */
const REVIEW_FILE_NAME = /^P[0-9]+-T[0-9]{2}-review\.json$/u;
const TASK_ID = /^P[0-9]+-T[0-9]{2}$/u;
const COMMIT_SHA1 = /^[0-9a-f]{40}$/u;

export const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITY_ORDER)[number];

export const REVIEW_AREAS = ["code_quality", "tests", "security", "performance", "architecture"] as const;
export type ReviewArea = (typeof REVIEW_AREAS)[number];

export const AREA_LABELS: Readonly<Record<string, string>> = {
  code_quality: "코드 품질",
  tests: "테스트",
  security: "보안",
  performance: "성능",
  architecture: "아키텍처 정합",
};

/** Backlog accumulates only the two lower severities. */
const BACKLOG_SEVERITIES: readonly string[] = ["medium", "low"];
const REVIEWERS: readonly string[] = ["main", "codex", "opus"];

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
  /** `none` means there is no valid result to show — display "결과 없음". */
  readonly status: "none" | "ok";
  readonly latest: ReviewResult | null;
  readonly results: readonly { readonly file: string; readonly result: ReviewResult }[];
  readonly invalid: readonly { readonly file: string; readonly errors: readonly string[] }[];
  readonly findingsBySeverity: readonly SeverityGroup[];
  readonly backlog: BacklogSummary;
};

export function isReviewFileName(fileName: string): boolean {
  return REVIEW_FILE_NAME.test(fileName);
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

function readReviewerList(value: unknown, label: string, minimum: number, errors: string[]): string[] {
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
      errors.push(`${label}의 "${name}"은 main·codex·opus 중 하나가 아닙니다.`);
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

function readFinding(raw: unknown, position: number, errors: string[]): ReviewFinding | null {
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

/** Parses one result file's text into a review result or a list of format errors. */
export function parseReviewDocument(text: string): ReviewParse {
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

  const taskId = readString(source, "task_id", errors);
  if (taskId.length > 0 && !TASK_ID.test(taskId)) {
    errors.push("task_id는 P[0-9]+-T[0-9]{2} 형식이어야 합니다.");
  }
  const at = readString(source, "at", errors);
  if (at.length > 0 && Number.isNaN(Date.parse(at))) {
    errors.push("at은 ISO 8601 시각이어야 합니다.");
  }
  const baseCommit = readString(source, "base_commit", errors);
  if (baseCommit.length > 0 && !COMMIT_SHA1.test(baseCommit)) {
    errors.push("base_commit은 40자리 SHA-1이어야 합니다.");
  }

  const participants = readReviewerList(source["participants"], "participants", 2, errors);
  const participantsNote = source["participants_note"];
  if (typeof participantsNote !== "string") {
    errors.push("participants_note는 문자열이어야 합니다. 3자 전부면 빈 문자열입니다.");
  }

  const scores = readScores(source["scores"], errors);
  const scoreRationale = readRationale(source["score_rationale"], errors);

  const total = source["total"];
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0 || total > 100) {
    errors.push("total은 0~100 정수여야 합니다.");
  }

  const rawFindings = source["findings"];
  const findings: ReviewFinding[] = [];
  if (!Array.isArray(rawFindings)) {
    errors.push("findings는 배열이어야 합니다. 확정 발견이 없으면 빈 배열입니다.");
  } else {
    rawFindings.forEach((raw, position) => {
      const finding = readFinding(raw, position, errors);
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

/**
 * Reads backlog lines outside fenced code blocks, so the format example inside
 * the document is never counted as a real item.
 */
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

/**
 * Builds the verification section view: the newest valid result, its findings by
 * severity, every format error and the backlog. Format errors never remove the
 * other content.
 */
export function summarizeReviews(
  documents: readonly ReviewDocument[],
  backlogMarkdown: string | null,
): ReviewsSummary {
  const results: { file: string; result: ReviewResult }[] = [];
  const invalid: { file: string; errors: readonly string[] }[] = [];

  for (const document of documents) {
    const parsed = parseReviewDocument(document.text);
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
