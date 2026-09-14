/** `#694B36` 같은 hex 색이 PR 번호로 읽히지 않게 뒤에 영숫자가 오면 버린다. */
const PR_NUMBER = /#(\d{3,5})(?![0-9A-Za-z])/g;
const TABLE_PR_CELL = /\|\s*#(\d{3,5})\s*\|/g;

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
    logMarkdowns.flatMap((log) => numbersIn(log, PR_NUMBER)),
  );

  return [...mentioned]
    .filter((number) => number >= oldest && !recorded.has(number))
    .sort((a, b) => a - b);
}
