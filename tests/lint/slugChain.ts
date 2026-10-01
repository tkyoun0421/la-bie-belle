import path from "node:path";
import {
  type BacklogRow,
  backlogRows,
  repositoryBacklog,
} from "@tests/lint/backlog-ids";
import {
  type SourceDoc,
  sourceDocs,
  sourceTarget,
} from "@tests/lint/spec-docs";

export type SlugChainViolation = {
  file: string;
  slug: string;
  /** 다른 슬러그로 이어진 자리. `sources` 항목이거나 backlog 행의 링크다. */
  linked: string;
  kind: "sources-slug" | "backlog-slug";
};

/** 사슬은 intent → spec → plan이고 각 단계는 앞 단계를 `sources`로 든다. */
const FEEDS: Record<string, string> = {
  "docs/2-design/spec": "docs/1-plan/intent",
  "docs/3-build/plans": "docs/2-design/spec",
};

const DONE = "done";

function slugOf(file: string): string {
  return path.posix.basename(file.split("#")[0], ".md");
}

export function sourcesSlugViolations(docs: SourceDoc[]): SlugChainViolation[] {
  return docs.flatMap((doc) => {
    const feeder = FEEDS[path.posix.dirname(doc.file)];
    const slug = slugOf(doc.file);

    if (!feeder) {
      return [];
    }

    return doc.sources
      .map((source) => sourceTarget(doc.file, source))
      .filter((target) => path.posix.dirname(target) === feeder)
      .filter((target) => slugOf(target) !== slug)
      .map((linked) => ({
        file: doc.file,
        slug,
        linked,
        kind: "sources-slug" as const,
      }));
  });
}

/** 과거 완료 작업은 범위 밖이라 `done` 행은 보지 않는다. */
export function backlogSlugViolations(
  rows: BacklogRow[],
): SlugChainViolation[] {
  return rows
    .filter((row) => row.status !== DONE)
    .flatMap((row) =>
      row.documents
        .filter((href) => slugOf(href) !== row.id)
        .map((linked) => ({
          file: "docs/backlog.md",
          slug: row.id,
          linked,
          kind: "backlog-slug" as const,
        })),
    );
}

export function slugChainViolations(
  root: string = process.cwd(),
): SlugChainViolation[] {
  const backlog = repositoryBacklog(root);

  return [
    ...sourcesSlugViolations(sourceDocs(root)),
    ...backlogSlugViolations(backlogRows(backlog.markdown, backlog.columns)),
  ];
}
