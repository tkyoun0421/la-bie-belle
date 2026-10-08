import path from "node:path";
import {
  type BacklogRow,
  backlogRows,
  repositoryBacklog,
} from "@tests/lint/backlogIds";
import { type SourceDoc, sourceDocs, sourceTarget } from "@tests/lint/specDocs";

export type SlugChainViolation = {
  file: string;
  slug: string;
  linked: string;
  kind: "sources-slug" | "backlog-slug";
};

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
