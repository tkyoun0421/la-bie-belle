/** `#694B36` 같은 hex 색이 PR 번호로 읽히지 않게 뒤에 영숫자가 오면 버린다. */
const PR_NUMBER = /#(\d{3,5})(?![0-9A-Za-z])/g;
const TABLE_PR_CELL = /\|\s*#(\d{3,5})\s*\|/g;

const OUR_REPOSITORY = "tkyoun0421/la-bie-belle";
/** 주소가 `)`를 못 넘어야 링크 뒤에 이어지는 별개 번호를 같이 삼키지 않는다. */
const GITHUB_LINK =
  /\[[^\]]*\]\(https?:\/\/github\.com\/([^/)]+\/[^/)]+)[^)]*\)/g;

/** 상위 저장소 PR 번호가 우리 회차 기록으로 읽히지 않게 그 링크는 통째로 지운다. */
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
