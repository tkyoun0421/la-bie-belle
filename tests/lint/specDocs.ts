// `sources` frontmatter를 드는 문서를 읽는다. CI 스크립트가 그대로 부르는 자리라
// 별칭 import를 두지 않는다 — Node는 `@tests/`를 못 푼다.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type SourceDoc = {
  /** 저장소 뿌리 기준 경로. `sources`의 상대 경로가 이 자리에서 풀린다. */
  file: string;
  /** 지금 정본을 딛고 서 있어 입력이 바뀌면 다시 봐야 하는 문서인지. */
  tracked: boolean;
  sources: string[];
};

/** `sources`를 드는 문서는 기능 spec과 구현 plan 둘이다. */
const SPEC_DIR = "docs/2-design/spec";
const PLAN_DIR = "docs/3-build/plans";
const SOURCE_DIRS = [SPEC_DIR, PLAN_DIR];

const APPROVED = "approved";
const COMPLETION_NOTICE = "> 완료된 작업의 당시 계획이다";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const FIELD = /^([A-Za-z_][\w-]*):\s*(.*)$/;
const ITEM = /^\s+-\s+(.*)$/;
const QUOTED = /^(["'])(.*)\1$/;
const HEADING = /^#{1,6}\s/;

function unquote(value: string): string {
  const quoted = QUOTED.exec(value.trim());
  return quoted ? quoted[2] : value.trim();
}

/**
 * frontmatter는 `key: 값`과 `key:` 아래 `- 항목` 목록만 쓴다. 그 둘을 읽는 데 YAML
 * 파서를 들이지 않는다.
 */
function frontmatterFields(markdown: string): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  const block = FRONTMATTER.exec(markdown);

  if (!block) {
    return fields;
  }

  let list: string[] | null = null;

  for (const line of block[1].split("\n")) {
    const item = ITEM.exec(line);

    if (item && list) {
      list.push(unquote(item[1]));
      continue;
    }

    const field = FIELD.exec(line);

    if (!field) {
      list = null;
      continue;
    }

    const value = field[2].trim();
    list = value === "" ? [] : null;
    fields.set(field[1], list ?? [unquote(value)]);
  }

  return fields;
}

export function frontmatterSources(markdown: string): string[] {
  return frontmatterFields(markdown).get("sources") ?? [];
}

export function frontmatterStatus(markdown: string): string | null {
  return frontmatterFields(markdown).get("status")?.[0] ?? null;
}

/**
 * 완료 머리글은 제목 바로 뒤에 서는 인용이다. 본문 중간에 같은 문장이 있어도 그
 * 자리가 아니면 완료가 아니다.
 */
function completed(markdown: string): boolean {
  const body = markdown.replace(FRONTMATTER, "").split("\n");
  const title = body.findIndex((line) => HEADING.test(line));

  if (title === -1) {
    return false;
  }

  const lead = body.slice(title + 1).find((line) => line.trim() !== "");

  return lead?.trim().startsWith(COMPLETION_NOTICE) ?? false;
}

/**
 * spec은 승인 마크가 서야 기준이 된다. plan은 frontmatter에 상태를 안 들어 완료
 * 머리글이 그 표시고, 완료된 plan은 당시 기록이라 정본을 딛지 않는다.
 */
function isTracked(file: string, markdown: string): boolean {
  return path.posix.dirname(file) === PLAN_DIR
    ? !completed(markdown)
    : frontmatterStatus(markdown) === APPROVED;
}

/** `sources` 항목이 가리키는 파일의 저장소 뿌리 기준 경로. `#앵커`는 뗀다. */
export function sourceTarget(file: string, source: string): string {
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(file), source.split("#")[0]),
  );
}

export function sourceDocFiles(root: string = process.cwd()): string[] {
  return SOURCE_DIRS.flatMap((dir) => {
    let entries: string[];

    try {
      entries = readdirSync(path.join(root, dir));
    } catch {
      return [];
    }

    return entries
      .filter((entry) => entry.endsWith(".md"))
      .map((entry) => `${dir}/${entry}`)
      .sort();
  });
}

export function sourceDocs(root: string = process.cwd()): SourceDoc[] {
  return sourceDocFiles(root).map((file) => {
    const markdown = readFileSync(path.join(root, file), "utf8");

    return {
      file,
      tracked: isTracked(file, markdown),
      sources: frontmatterSources(markdown),
    };
  });
}
