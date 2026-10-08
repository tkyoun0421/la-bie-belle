const PR_NUMBER = /#(\d{3,5})(?![0-9A-Za-z])/g;
const TABLE_PR_CELL = /\|\s*#(\d{3,5})\s*\|/g;

const OUR_REPOSITORY = "tkyoun0421/la-bie-belle";
const GITHUB_LINK =
  /\[[^\]]*\]\(https?:\/\/github\.com\/([^/)]+\/[^/)]+)[^)]*\)/g;

function withoutOtherRepositoryLinks(markdown: string): string {
  return markdown.replace(GITHUB_LINK, (link, repository: string) =>
    repository === OUR_REPOSITORY ? link : " ",
  );
}

function numbersIn(source: string, pattern: RegExp): number[] {
  return [...source.matchAll(pattern)].map((match) => Number(match[1]));
}

export function changelogViolations(
  changelogMarkdown: string,
  logMarkdowns: string[],
): number[] {
  const recorded = new Set(numbersIn(changelogMarkdown, TABLE_PR_CELL));
  if (recorded.size === 0) {
    return [];
  }

  const oldest = Math.min(...recorded);
  const mentioned = new Set(
    logMarkdowns.flatMap((log) =>
      numbersIn(withoutOtherRepositoryLinks(log), PR_NUMBER),
    ),
  );

  return [...mentioned]
    .filter((number) => number >= oldest && !recorded.has(number))
    .sort((a, b) => a - b);
}
