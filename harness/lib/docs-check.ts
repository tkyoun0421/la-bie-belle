import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { INDEX_PATH, readTextFile, repoPath } from "./repo.ts";
import type { IndexEntry } from "./task-index.ts";
import { isTask, parseIndexJsonl, readObjectField, readStringField, recordId } from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "check:docs";
const ADR_DIRECTORY = "docs/standards/adr";
const PRD_PATH = "docs/product/PRD.md";
const DOMAIN_PATH = "docs/product/DOMAIN.md";
const DOCS_ALLOWED = new Set(["SDD", "DDD"]);
const LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu;

function makeViolation(file: string, message: string, hint: string, line?: number): Violation {
  return line === undefined ? { gate: GATE, file, message, hint } : { gate: GATE, file, line, message, hint };
}

export function checkDependencyCycles(entries: readonly IndexEntry[]): Violation[] {
  const byId = new Map(entries.map((entry) => [recordId(entry.record), entry]));
  const color = new Map<string, 1 | 2>();
  const seenCycles = new Set<string>();
  const violations: Violation[] = [];

  const visit = (id: string, stack: string[]): void => {
    color.set(id, 1);
    stack.push(id);

    const dependsOn = byId.get(id)?.record["depends_on"];
    if (Array.isArray(dependsOn)) {
      for (const dependency of dependsOn) {
        if (typeof dependency !== "string" || !byId.has(dependency)) {
          continue;
        }
        const state = color.get(dependency);
        if (state === undefined) {
          visit(dependency, stack);
        } else if (state === 1) {
          const cycleStart = stack.indexOf(dependency);
          const cyclePath = [...stack.slice(cycleStart), dependency];
          const key = [...new Set(cyclePath)].sort().join(",");
          if (!seenCycles.has(key)) {
            seenCycles.add(key);
            violations.push(
              makeViolation(
                INDEX_PATH,
                `의존성 순환: ${cyclePath.join(" → ")}`,
                "depends_on 그래프에서 순환을 끊으세요.",
                byId.get(cyclePath[0] ?? "")?.line,
              ),
            );
          }
        }
      }
    }

    stack.pop();
    color.set(id, 2);
  };

  for (const entry of entries) {
    const id = recordId(entry.record);
    if (!color.has(id)) {
      visit(id, []);
    }
  }

  return violations;
}

export function checkHeadingTitles(root: string, entries: readonly IndexEntry[]): Violation[] {
  const violations: Violation[] = [];
  const docCache = new Map<string, string | null>();

  for (const entry of entries) {
    const { record, line } = entry;
    if (!isTask(record) || readObjectField(record, "product_approval") === null) {
      continue;
    }

    const id = recordId(record);
    const title = readStringField(record, "title");
    const docPath = readStringField(record, "doc");
    if (title === null || docPath === null) {
      continue;
    }

    if (!docCache.has(docPath)) {
      docCache.set(docPath, readTextFile(root, docPath));
    }
    const text = docCache.get(docPath) ?? null;
    if (text === null) {
      violations.push(
        makeViolation(docPath, `${id}: 문서 ${docPath}를 읽을 수 없습니다.`, "doc 필드 경로를 확인하세요.", line),
      );
      continue;
    }

    const prefix = `### ${id}. `;
    const lines = text.split("\n");
    const headingIndex = lines.findIndex((candidate) => candidate.startsWith(prefix));
    if (headingIndex === -1) {
      violations.push(
        makeViolation(
          docPath,
          `${id}: '${prefix}<제목>' heading이 없습니다.`,
          `${docPath}에 '### ${id}. ${title}' heading을 추가하세요.`,
        ),
      );
      continue;
    }

    const heading = (lines[headingIndex] ?? "").slice(prefix.length).trim();
    if (heading !== title) {
      violations.push(
        makeViolation(
          docPath,
          `${id}: heading 제목 '${heading}'이 index 제목 '${title}'과 다릅니다.`,
          "index의 title과 phase 문서의 heading 제목을 일치시키세요.",
          headingIndex + 1,
        ),
      );
    }
  }

  return violations;
}

function listAdrFiles(root: string): string[] {
  try {
    return readdirSync(repoPath(root, ADR_DIRECTORY));
  } catch {
    return [];
  }
}

export function checkSpecRefs(root: string, entries: readonly IndexEntry[]): Violation[] {
  const violations: Violation[] = [];
  const adrFiles = listAdrFiles(root);
  const prdText = readTextFile(root, PRD_PATH) ?? "";
  const domainText = readTextFile(root, DOMAIN_PATH) ?? "";

  for (const entry of entries) {
    const { record, line } = entry;
    const id = recordId(record);
    const specRefs = record["spec_refs"];
    if (!Array.isArray(specRefs)) {
      continue;
    }

    for (const ref of specRefs) {
      if (typeof ref !== "string") {
        continue;
      }
      const separatorIndex = ref.indexOf(":");
      if (separatorIndex === -1) {
        violations.push(
          makeViolation(
            INDEX_PATH,
            `${id}: spec_refs '${ref}'에 접두(PREFIX:)가 없습니다.`,
            "ADR:·PRD:·DOMAIN:·DOCS: 형식을 쓰세요.",
            line,
          ),
        );
        continue;
      }

      const prefix = ref.slice(0, separatorIndex);
      const rest = ref.slice(separatorIndex + 1);

      if (prefix === "ADR") {
        if (!adrFiles.some((fileName) => fileName.startsWith(`${rest}-`))) {
          violations.push(
            makeViolation(
              INDEX_PATH,
              `${id}: spec_refs '${ref}'가 가리키는 ADR 문서가 ${ADR_DIRECTORY}에 없습니다.`,
              "번호를 확인하거나 ADR 파일을 추가하세요.",
              line,
            ),
          );
        }
      } else if (prefix === "PRD") {
        if (!prdText.includes(rest)) {
          violations.push(
            makeViolation(
              INDEX_PATH,
              `${id}: spec_refs '${ref}'의 '${rest}'가 ${PRD_PATH}에 없습니다.`,
              "PRD 문서의 ID를 확인하세요.",
              line,
            ),
          );
        }
      } else if (prefix === "DOMAIN") {
        if (!domainText.includes(rest)) {
          violations.push(
            makeViolation(
              INDEX_PATH,
              `${id}: spec_refs '${ref}'의 '${rest}'가 ${DOMAIN_PATH}에 없습니다.`,
              "DOMAIN 문서의 경계 이름을 확인하세요.",
              line,
            ),
          );
        }
      } else if (prefix === "DOCS") {
        if (!DOCS_ALLOWED.has(rest)) {
          violations.push(
            makeViolation(
              INDEX_PATH,
              `${id}: spec_refs '${ref}'의 '${rest}'는 허용 목록(SDD·DDD)에 없습니다.`,
              "허용된 DOCS 이름만 쓰세요.",
              line,
            ),
          );
        }
      } else {
        violations.push(
          makeViolation(
            INDEX_PATH,
            `${id}: spec_refs '${ref}'의 접두 '${prefix}'를 알 수 없습니다.`,
            "ADR·PRD·DOMAIN·DOCS 중 하나를 쓰세요.",
            line,
          ),
        );
      }
    }
  }

  return violations;
}

function listMarkdownFiles(root: string): string[] {
  const results: string[] = [];

  const walk = (relativeDirectory: string): void => {
    let entries;
    try {
      entries = readdirSync(repoPath(root, relativeDirectory), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relativePath =
        relativeDirectory === "" ? entry.name : `${relativeDirectory}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(relativePath);
      } else if (entry.name.endsWith(".md")) {
        results.push(relativePath);
      }
    }
  };

  walk("docs");
  for (const rootFile of ["CLAUDE.md", "README.md"]) {
    if (existsSync(repoPath(root, rootFile))) {
      results.push(rootFile);
    }
  }

  return results;
}

export function checkInternalLinks(root: string): Violation[] {
  const violations: Violation[] = [];

  for (const relativePath of listMarkdownFiles(root)) {
    const text = readTextFile(root, relativePath);
    if (text === null) {
      continue;
    }

    text.split("\n").forEach((lineText, index) => {
      for (const match of lineText.matchAll(LINK_PATTERN)) {
        const target = match[1];
        if (target === undefined || /^https?:\/\//u.test(target) || target.startsWith("#")) {
          continue;
        }
        const withoutAnchor = target.split("#")[0];
        if (withoutAnchor === undefined || withoutAnchor === "") {
          continue;
        }

        const resolvedAbsolute = resolve(dirname(repoPath(root, relativePath)), withoutAnchor);
        if (!existsSync(resolvedAbsolute)) {
          violations.push(
            makeViolation(
              relativePath,
              `상대 링크 '${target}'가 가리키는 파일이 없습니다.`,
              "경로를 확인하세요.",
              index + 1,
            ),
          );
        }
      }
    });
  }

  return violations;
}

export function runDocsCheck(root: string): Violation[] {
  const indexText = readTextFile(root, INDEX_PATH);
  if (indexText === null) {
    return [
      makeViolation(
        INDEX_PATH,
        "task index 파일을 읽을 수 없습니다.",
        `${INDEX_PATH} 경로에 index 파일이 있어야 합니다.`,
      ),
    ];
  }

  const entries = parseIndexJsonl(indexText).entries;

  return [
    ...checkDependencyCycles(entries),
    ...checkHeadingTitles(root, entries),
    ...checkSpecRefs(root, entries),
    ...checkInternalLinks(root),
  ];
}
