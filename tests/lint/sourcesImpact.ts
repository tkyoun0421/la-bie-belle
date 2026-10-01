// 승인 뒤 `sources` 변경의 영향을 판정한다. CI 스크립트가 그대로 부르는 자리라
// 별칭 import를 두지 않는다 — Node는 `@tests/`를 못 푼다.

import path from "node:path";

/** `spec-docs.ts`의 `SourceDoc`이 이 모양을 만족한다. */
export type ImpactDoc = {
  file: string;
  tracked: boolean;
  sources: string[];
};

export type ImpactViolation = {
  /** 영향받은 spec·plan. 절 자체가 없으면 목록 전부가 걸린다. */
  document: string;
  kind: "missing-section" | "missing-document";
};

const IMPACT_SECTION = "영향 확인";
const HEADING = /^(#{1,6})\s+(.*?)\s*$/;

function target(file: string, source: string): string {
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(file), source.split("#")[0]),
  );
}

/**
 * 추적 중인 문서의 입력이 이 PR에서 바뀌었는지 본다. 추적 판정은 자리마다 달라
 * `spec-docs.ts`가 소유한다.
 */
export function findImpacted(
  changedFiles: string[],
  docs: ImpactDoc[],
): string[] {
  const changed = new Set(changedFiles);

  return docs
    .filter((doc) => doc.tracked)
    .filter((doc) =>
      doc.sources.some((source) => changed.has(target(doc.file, source))),
    )
    .map((doc) => doc.file);
}

/** PR 본문에서 「영향 확인」 제목 아래부터 같거나 더 높은 제목 앞까지. */
function impactSection(prBody: string): string | null {
  const lines = prBody.split("\n");
  const start = lines.findIndex((line) => {
    const heading = HEADING.exec(line);
    return heading !== null && heading[2] === IMPACT_SECTION;
  });

  if (start === -1) {
    return null;
  }

  const level = (HEADING.exec(lines[start]) as RegExpExecArray)[1].length;
  const end = lines.findIndex((line, index) => {
    const heading = HEADING.exec(line);
    return index > start && heading !== null && heading[1].length <= level;
  });

  return lines.slice(start + 1, end === -1 ? lines.length : end).join("\n");
}

/**
 * 영향받은 문서가 있으면 PR 본문이 「영향 확인」 절에서 그 문서를 하나씩 들어야
 * 한다. 문서 이름은 경로 전체든 파일명이든 받는다.
 */
export function checkImpactSection(
  prBody: string,
  impacted: string[],
): ImpactViolation[] {
  if (impacted.length === 0) {
    return [];
  }

  const section = impactSection(prBody);

  if (section === null) {
    return impacted.map((document) => ({
      document,
      kind: "missing-section" as const,
    }));
  }

  return impacted
    .filter((document) => !section.includes(path.posix.basename(document)))
    .map((document) => ({ document, kind: "missing-document" as const }));
}
