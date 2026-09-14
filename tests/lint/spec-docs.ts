// `sources` frontmatter를 드는 문서를 읽는다. CI 스크립트가 그대로 부르는 자리라
// 별칭 import를 두지 않는다 — Node는 `@tests/`를 못 푼다.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type SourceDoc = {
  /** 저장소 뿌리 기준 경로. `sources`의 상대 경로가 이 자리에서 풀린다. */
  file: string;
  status: string | null;
  sources: string[];
};

/** `sources`를 드는 문서는 기능 spec과 구현 plan 둘이다. */
const SOURCE_DIRS = ["docs/2-design/spec", "docs/3-build/plans"];

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const FIELD = /^([A-Za-z_][\w-]*):\s*(.*)$/;
const ITEM = /^\s+-\s+(.*)$/;
const QUOTED = /^(["'])(.*)\1$/;

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
      status: frontmatterStatus(markdown),
      sources: frontmatterSources(markdown),
    };
  });
}
