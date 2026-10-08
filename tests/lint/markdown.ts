export type MarkdownHeading = {
  level: number;
  text: string;
  slug: string;
  line: number;
};

export type MarkdownLink = {
  href: string;
  line: number;
};

export type MarkdownCodeSpan = {
  text: string;
  line: number;
};

export type MarkdownDoc = {
  headings: MarkdownHeading[];
  links: MarkdownLink[];
  codeSpans: MarkdownCodeSpan[];
  section: (heading: string) => string[];
};

const FENCE = /^\s*```/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const CODE_SPAN = /`([^`]+)`/g;
const LINK = /!?\[[^\]]*\]\(\s*([^)\s]*)[^)]*\)/g;
const EMPHASIS = /[`*]/g;
const NOT_IN_SLUG = /[^\p{L}\p{N}\s\-_]/gu;
const SPACE = /\s/g;

function headingText(raw: string): string {
  return raw.trim().replace(EMPHASIS, "").trim();
}

function baseSlug(text: string): string {
  return text.toLowerCase().replace(NOT_IN_SLUG, "").trim().replace(SPACE, "-");
}

function slugger(): (text: string) => string {
  const seen = new Map<string, number>();

  return (text) => {
    const base = baseSlug(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

function outsideCode(lines: string[]): (string | null)[] {
  let inFence = false;

  return lines.map((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return null;
    }
    return inFence ? null : line;
  });
}

function blankSpan(span: string): string {
  return " ".repeat(span.length);
}

export function parseMarkdown(source: string): MarkdownDoc {
  const lines = source.split("\n");
  const scanned = outsideCode(lines);

  const headings: MarkdownHeading[] = [];
  const links: MarkdownLink[] = [];
  const codeSpans: MarkdownCodeSpan[] = [];
  const nextSlug = slugger();

  for (const [index, line] of scanned.entries()) {
    if (line === null) {
      continue;
    }

    const lineNumber = index + 1;
    const heading = HEADING.exec(line);

    if (heading) {
      const text = headingText(heading[2]);
      headings.push({
        level: heading[1].length,
        text,
        slug: nextSlug(text),
        line: lineNumber,
      });
    }

    let outsideSpans = "";
    let cursor = 0;

    for (const span of line.matchAll(CODE_SPAN)) {
      codeSpans.push({ text: span[1], line: lineNumber });
      outsideSpans += line.slice(cursor, span.index) + blankSpan(span[0]);
      cursor = span.index + span[0].length;
    }

    outsideSpans += line.slice(cursor);

    for (const [, href] of outsideSpans.matchAll(LINK)) {
      links.push({ href, line: lineNumber });
    }
  }

  function section(heading: string): string[] {
    const start = headings.find((entry) => entry.text === heading);
    if (!start) {
      return [];
    }

    const end = headings.find(
      (entry) => entry.line > start.line && entry.level <= start.level,
    );

    return lines.slice(start.line, end ? end.line - 1 : lines.length);
  }

  return { headings, links, codeSpans, section };
}
