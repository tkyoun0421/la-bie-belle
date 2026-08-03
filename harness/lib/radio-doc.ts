/** Heading that owns the machine readable commit scope declaration. */
export const ALLOWED_PATHS_HEADING = "## 변경 허용 경로";

const HEADING_PATTERN = /^##[ \t]+변경 허용 경로[ \t]*$/u;
const SECTION_PATTERN = /^##[ \t]/u;
const FENCE_PATTERN = /^[ \t]*```/u;

/**
 * Reads the glob list from the first fenced code block under
 * `## 변경 허용 경로`. Returns an empty array when the section or its code block
 * is missing, which the commit scope gate treats as a violation.
 */
export function parseAllowedPaths(markdown: string): string[] {
  const lines = markdown.split("\n");
  const headingIndex = lines.findIndex((line) => HEADING_PATTERN.test(line));
  if (headingIndex < 0) {
    return [];
  }

  for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? "";
    if (SECTION_PATTERN.test(line)) {
      return [];
    }
    if (!FENCE_PATTERN.test(line)) {
      continue;
    }
    const paths: string[] = [];
    for (let inner = cursor + 1; inner < lines.length; inner += 1) {
      const candidate = lines[inner] ?? "";
      if (FENCE_PATTERN.test(candidate)) {
        break;
      }
      const value = candidate.trim();
      if (value.length > 0 && !value.startsWith("#")) {
        paths.push(value);
      }
    }
    return paths;
  }

  return [];
}
