export function memberOf<Member extends string>(
  all: readonly Member[],
): (value: unknown) => value is Member {
  const known = new Set<string>(all);

  return (value): value is Member =>
    typeof value === "string" && known.has(value);
}
