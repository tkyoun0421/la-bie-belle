import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseMarkdown } from "@tests/lint/markdown";

export type DocLinkViolation = {
  file: string;
  href: string;
  line: number;
  kind: "missing-file" | "missing-anchor";
};

const DOCS = "docs";
const EXCLUDED_PREFIXES = [`${DOCS}/log/`];
const ABSOLUTE_SCHEME = /^(https?|mailto):/i;

/** globSync는 Node 22에서 experimental이라 실행마다 경고를 찍는다. */
function markdownFiles(root: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(path.join(root, DOCS), {
      recursive: true,
    }) as string[];
  } catch {
    return [];
  }

  return entries
    .map((entry) => `${DOCS}/${entry.split(path.sep).join("/")}`)
    .filter((file) => file.endsWith(".md"))
    .filter(
      (file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)),
    )
    .sort();
}

function decode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/** 링크는 글이 놓인 자리 기준이고, 저장소 뿌리를 적는 관례도 받는다. */
function resolveTarget(
  root: string,
  from: string,
  target: string,
): string | null {
  return (
    [path.resolve(path.dirname(from), target), path.resolve(root, target)].find(
      (candidate) => existsSync(candidate),
    ) ?? null
  );
}

function anchorsOf(source: string): Set<string> {
  return new Set(parseMarkdown(source).headings.map((heading) => heading.slug));
}

export function docLinkViolations(
  root: string = process.cwd(),
): DocLinkViolation[] {
  const violations: DocLinkViolation[] = [];
  const anchorCache = new Map<string, Set<string>>();

  function anchorsIn(absolute: string): Set<string> {
    const cached = anchorCache.get(absolute);
    if (cached) {
      return cached;
    }

    const anchors = anchorsOf(readFileSync(absolute, "utf8"));
    anchorCache.set(absolute, anchors);
    return anchors;
  }

  for (const file of markdownFiles(root)) {
    const absolute = path.join(root, file);
    const source = readFileSync(absolute, "utf8");

    for (const { href, line } of parseMarkdown(source).links) {
      if (href === "" || ABSOLUTE_SCHEME.test(href)) {
        continue;
      }

      const hash = href.indexOf("#");
      const target = hash === -1 ? href : href.slice(0, hash);
      const anchor = hash === -1 ? "" : decode(href.slice(hash + 1));
      const targetPath =
        target === ""
          ? absolute
          : resolveTarget(root, absolute, decode(target));

      if (targetPath === null) {
        violations.push({ file, href, line, kind: "missing-file" });
        continue;
      }

      if (anchor === "" || !targetPath.endsWith(".md")) {
        continue;
      }

      if (!anchorsIn(targetPath).has(anchor.toLowerCase())) {
        violations.push({ file, href, line, kind: "missing-anchor" });
      }
    }
  }

  return violations;
}
